"""Write the V2 "golden" file: 1,000 sky-position cases computed with SPICE.

The browser tests (web/src/engine/tests/golden.test.ts) read this file, recompute every
case with the TypeScript engine, and require every answer to agree within 0.001 deg.

Run:  python pipeline/golden.py
"""
import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import spiceypy as sp

from geometry import Site, sky_view_at
from spice_setup import KERNEL_FILES, load_kernels

REPO_ROOT = Path(__file__).resolve().parent.parent
GOLDEN_FILE = REPO_ROOT / "web" / "src" / "engine" / "tests" / "golden_v2.json"
SITES_FILE = REPO_ROOT / "web" / "public" / "data" / "sites.json"

SEED = 2026
TOLERANCE_DEG = 0.001
FIRST_UTC = datetime(2023, 1, 1, 0, 0, 1, tzinfo=timezone.utc)
LAST_UTC = datetime(2032, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
N_GLOBAL, N_POLAR, N_NAMED = 600, 300, 60


def iso(moment: datetime) -> str:
    return moment.strftime("%Y-%m-%dT%H:%M:%SZ")


def random_time(rng: np.random.Generator) -> datetime:
    """A whole-second UTC time anywhere in the ephemeris range (most fall between hours)."""
    span = int((LAST_UTC - FIRST_UTC).total_seconds())
    return FIRST_UTC + timedelta(seconds=int(rng.integers(0, span + 1)))


def build_specs(rng: np.random.Generator) -> list[dict]:
    """The (site, time) inputs, before SPICE answers them."""
    specs: list[dict] = []

    def add(group: str, lat: float, lon: float, ground_m: float, mast_m: float, when: datetime) -> None:
        specs.append({"group": group, "lat": lat, "lon": lon, "ground_m": ground_m,
                      "mast_m": mast_m, "utc": iso(when)})

    for _ in range(N_GLOBAL):
        lat = float(np.degrees(np.arcsin(rng.uniform(-1, 1))))      # uniform over the sphere
        add("global", lat, float(rng.uniform(-180, 180)), float(rng.uniform(0, 6000)),
            float(rng.uniform(0, 10)), random_time(rng))

    for i in range(N_POLAR):
        lat = float(rng.uniform(-89.99, -75)) if i >= 20 else float(rng.uniform(-90, -89.99))
        add("polar", lat, float(rng.uniform(-180, 180)), float(rng.uniform(0, 3000)),
            float(rng.uniform(0, 10)), random_time(rng))

    named = json.loads(SITES_FILE.read_text())
    named = [s for s in named if s.get("lat") is not None and s.get("lon") is not None]
    for i in range(N_NAMED):
        s = named[i % len(named)]
        add("named", float(s["lat"]), float(s["lon"]), float(s.get("height_m") or 0.0), 2.0,
            random_time(rng))

    # Fixed edge cases (40): the pole, the corners of the map, the ends of the file, round hours
    edge_sites = [(-90.0, 0.0), (-90.0, 123.0), (90.0, 0.0), (0.0, 0.0), (0.0, 180.0),
                  (0.0, -180.0), (0.0, 179.999), (0.0, -179.999)]
    edge_times = [FIRST_UTC, LAST_UTC, datetime(2026, 11, 14, 9, 0, 0, tzinfo=timezone.utc),
                  datetime(2028, 2, 29, 12, 0, 0, tzinfo=timezone.utc),
                  datetime(2030, 7, 1, 0, 0, 0, tzinfo=timezone.utc)]
    for lat, lon in edge_sites:
        for when in edge_times:
            add("edge", lat, lon, 0.0, 2.0, when)

    return specs


def solve(spec: dict) -> dict:
    site = Site(spec["lat"], spec["lon"], spec["ground_m"], spec["mast_m"])
    when = datetime.strptime(spec["utc"], "%Y-%m-%dT%H:%M:%SZ")
    et = sp.str2et(when.strftime("%Y-%m-%dT%H:%M:%S"))
    view = sky_view_at(site, et)
    return {
        **spec,
        "tdb_s": round(et, 6),
        "sun_az": round(view.sun.az_deg, 9),
        "sun_el": round(view.sun.el_deg, 9),
        "earth_az": round(view.earth.az_deg, 9),
        "earth_el": round(view.earth.el_deg, 9),
        "sep": round(view.sun_earth_separation_deg, 9),
        "sun_r": round(view.sun.angular_radius_deg, 9),
        "earth_r": round(view.earth.angular_radius_deg, 9),
    }


def main() -> None:
    load_kernels()
    rng = np.random.default_rng(SEED)
    specs = build_specs(rng)
    cases = [solve(s) for s in specs]
    for index, case in enumerate(cases):
        case["id"] = index

    body = {
        "generator": "pipeline/golden.py",
        "seed": SEED,
        "tolerance_deg": TOLERANCE_DEG,
        "frame": "MOON_ME",
        "light_time": "CN+S",
        "kernels": KERNEL_FILES,
        "count": len(cases),
        "cases": cases,
    }
    GOLDEN_FILE.write_text(json.dumps(body, indent=None, separators=(",", ":")) + "\n")
    digest = hashlib.sha256(GOLDEN_FILE.read_bytes()).hexdigest()
    print(f"Wrote {GOLDEN_FILE.relative_to(REPO_ROOT).as_posix()}: {len(cases)} cases, sha256 {digest[:16]}...")


if __name__ == "__main__":
    main()
