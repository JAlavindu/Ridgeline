import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import spiceypy as sp

from geometry import Site, angle_between_deg, sky_view_at
from horizons import az_el_table
from spice_setup import load_kernels

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_FILE = REPO_ROOT / "web" / "public" / "data" / "validation.json"

START_UTC = "2026-01-01 00:00"
STOP_UTC = "2026-06-01 00:00"
STEP = "7h"

V1_TARGET_DEG = 0.002
V1_HARD_FAIL_DEG = 0.01

V1_SITES = {
    "Equator (0, 0)": Site(0.0, 0.0),
    "Apollo 11": Site(0.67408, 23.47297),
    "IM-1": Site(-80.13, 1.44),
    "Connecting Ridge": Site(-89.4395, -137.1934),
    "Chandrayaan-3 (ISRO)": Site(-69.367621, 32.348126),
    "Chang'e-4": Site(-45.4446, 177.5991),
}


def unit_from_az_el(az_deg: float, el_deg: float) -> np.ndarray:
    """Direction in the local (east, north, up) frame for an azimuth and elevation."""
    az, el = np.radians(az_deg), np.radians(el_deg)
    return np.array([np.cos(el) * np.sin(az), np.cos(el) * np.cos(az), np.sin(el)])


def sky_gap_deg(az1: float, el1: float, az2: float, el2: float) -> float:
    """Angle on the sky between two (azimuth, elevation) directions, in degrees."""
    return angle_between_deg(unit_from_az_el(az1, el1), unit_from_az_el(az2, el2))


def compare_with_horizons(site: Site, body: str, time_shift_s: float = 0.0) -> np.ndarray:
    """Sky gap (deg) between us and Horizons at every time. time_shift_s fakes a clock mistake."""
    alt_km = (site.ground_height_m + site.mast_height_m) / 1000.0
    rows = az_el_table(body, site.lon_deg, site.lat_deg, alt_km, START_UTC, STOP_UTC, STEP)
    gaps = []
    for utc, h_az, h_el in rows:
        et = sp.str2et(utc) + time_shift_s
        view = sky_view_at(site, et)
        ours = view.sun if body == "SUN" else view.earth
        gaps.append(sky_gap_deg(ours.az_deg, ours.el_deg, h_az, h_el))
    return np.array(gaps)


def run_v1() -> dict:
    per_site = {}
    worst = 0.0
    samples = 0
    for name, site in V1_SITES.items():
        per_site[name] = {}
        for body in ("SUN", "EARTH"):
            gaps = compare_with_horizons(site, body)
            per_site[name][body.lower()] = {
                "max_deg": round(float(gaps.max()), 6),
                "mean_deg": round(float(gaps.mean()), 6),
                "count": len(gaps),
            }
            worst = max(worst, float(gaps.max()))
            samples += len(gaps)
            print(f"  V1 {name:22s} {body:5s} max {gaps.max():.6f} deg over {len(gaps)} times")

    return {
        "id": "V1",
        "name": "Sun and Earth positions vs NASA JPL Horizons",
        "what": (f"Azimuth and elevation of the Sun and Earth from {len(V1_SITES)} sites, "
                 f"every {STEP} from {START_UTC} to {STOP_UTC} UTC ({samples} comparisons). "
                 "Ours: SPICE (DE440, MOON_ME, CN+S) + pipeline/geometry.py. "
                 "Horizons: coord@301, QUANTITIES 4, airless."),
        "tolerance": f"target <= {V1_TARGET_DEG} deg; hard fail > {V1_HARD_FAIL_DEG} deg",
        "result_deg": round(worst, 6),
        "expected_outcome": "pass",
        "outcome": "pass" if worst <= V1_TARGET_DEG else "fail",
        "explanation": ("Largest angle on the sky between our direction and Horizons'. Small "
                        "remaining differences come from light-time measured from the Moon's "
                        "centre (ours) vs from the site (Horizons) and from Horizons' "
                        "gravitational light bending."),
        "details": per_site,
    }


def run_v3() -> dict:
    """Pretend the UTC clock time is already TDB, i.e. shift every time by -(TDB - UTC)."""
    site = V1_SITES["Equator (0, 0)"]
    et = sp.str2et(START_UTC)
    tdb_minus_utc = et - sp.str2et(START_UTC + " TDB")
    gaps = compare_with_horizons(site, "SUN", time_shift_s=-tdb_minus_utc)
    worst = float(gaps.max())
    print(f"  V3 equator SUN with UTC used as TDB: max {worst:.6f} deg")

    return {
        "id": "V3",
        "name": "Time trap: UTC fed in as TDB",
        "what": (f"V1 for the equator Sun again, but every time is shifted by "
                 f"-{tdb_minus_utc:.3f} s, the mistake of treating clock time (UTC) as TDB."),
        "tolerance": f"must exceed the V1 target of {V1_TARGET_DEG} deg (expected about 0.0098 deg)",
        "result_deg": round(worst, 6),
        "expected_outcome": "fail",
        "outcome": "fail" if worst > V1_TARGET_DEG else "pass",
        "explanation": ("The Sun crosses the lunar sky at about 0.0085 deg per minute, so a "
                        f"{tdb_minus_utc:.1f} s clock mistake moves it about 0.0098 deg. "
                        "This test failing proves V1 is sensitive enough to catch time-scale bugs."),
    }


def main() -> None:
    load_kernels()
    print("Running validation (Horizons replies are cached in pipeline/cache/horizons/) ...")
    tests = [run_v1(), run_v3()]

    for test in tests:
        test["passed"] = test["outcome"] == test["expected_outcome"]

    report = {
        "generated_utc": f"{datetime.now(timezone.utc):%Y-%m-%dT%H:%M:%SZ}",
        "generator": "pipeline/validate.py",
        "tests": tests,
    }
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(report, indent=2) + "\n")

    print()
    for test in tests:
        mark = "PASS" if test["passed"] else "FAIL"
        print(f"[{mark}] {test['id']} {test['name']}: {test['result_deg']} deg "
              f"(expected to {test['expected_outcome']}, did {test['outcome']})")
    print("Wrote", OUT_FILE.relative_to(REPO_ROOT).as_posix())

    if not all(test["passed"] for test in tests):
        sys.exit(1)


if __name__ == "__main__":
    main()
