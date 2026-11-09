import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import spiceypy as sp

from spice_setup import KERNEL_FILES, load_kernels

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "web" / "public" / "data"
BIN_FILE = DATA_DIR / "ephem.bin"
META_FILE = DATA_DIR / "ephem_meta.json"

START_UTC = "2023-01-01T00:00:00"
END_UTC = "2033-01-01T00:00:00"
STEP_S = 3600.0
FRAME = "MOON_ME"
ABCORR = "CN+S"
OBSERVER = "MOON"
FIELDS = [
    "sun_dir_x", "sun_dir_y", "sun_dir_z", "sun_dist_km",
    "earth_dir_x", "earth_dir_y", "earth_dir_z", "earth_dist_km",
]


def make_epochs() -> np.ndarray:
    """TDB seconds past J2000 for every hour from START_UTC to END_UTC (both included)."""
    start = sp.str2et(START_UTC)
    end = sp.str2et(END_UTC)
    count = round((end - start) / STEP_S) + 1
    return start + STEP_S * np.arange(count)


def direction_and_distance(target: str, ets: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Unit direction (N x 3) and distance in km (N) of a body seen from the Moon's centre."""
    positions, _ = sp.spkpos(target, ets, FRAME, ABCORR, OBSERVER)
    positions = np.array(positions)
    distances = np.linalg.norm(positions, axis=1)
    directions = positions / distances[:, np.newaxis]
    return directions, distances


def build_table(ets: np.ndarray) -> np.ndarray:
    """One row per hour, 8 columns in FIELDS order, as float64."""
    sun_dir, sun_dist = direction_and_distance("SUN", ets)
    earth_dir, earth_dist = direction_and_distance("EARTH", ets)
    return np.column_stack([sun_dir, sun_dist, earth_dir, earth_dist])


def write_files(ets: np.ndarray, table: np.ndarray) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    table.astype("<f4").tofile(BIN_FILE)

    meta = {
        "description": "Hourly Sun and Earth positions seen from the Moon's centre",
        "frame": FRAME,
        "aberration_correction": ABCORR,
        "observer": OBSERVER,
        "start_utc": START_UTC + "Z",
        "start_tdb_s": float(ets[0]),
        "time_scale": "TDB seconds past J2000 (2000-01-01T12:00:00 TDB)",
        "step_s": STEP_S,
        "count": len(ets),
        "fields": FIELDS,
        "values_per_record": len(FIELDS),
        "dtype": "float32",
        "byte_order": "little",
        "kernels": KERNEL_FILES,
        "generated_utc": f"{datetime.now(timezone.utc):%Y-%m-%dT%H:%M:%SZ}",
        "generator": f"pipeline/ephemeris.py (SpiceyPy {sp.__version__}, {sp.tkvrsn('TOOLKIT')})",
    }
    META_FILE.write_text(json.dumps(meta, indent=2) + "\n")


def self_check(ets: np.ndarray, table: np.ndarray) -> bool:
    """Print sanity checks on the written file. Returns True if all pass."""
    ok = True

    def report(name: str, passed: bool, detail: str) -> None:
        nonlocal ok
        ok = ok and passed
        print(f"[{'PASS' if passed else 'FAIL'}] {name}: {detail}")

    expected_bytes = len(ets) * len(FIELDS) * 4
    actual_bytes = BIN_FILE.stat().st_size
    report("file size", actual_bytes == expected_bytes,
           f"{actual_bytes:,} bytes (expected {len(ets):,} x {len(FIELDS)} x 4 = {expected_bytes:,})")

    stored = np.fromfile(BIN_FILE, dtype="<f4").reshape(-1, len(FIELDS)).astype(np.float64)

    sun_dist = stored[:, 3]
    report("Sun distance", 145e6 < sun_dist.min() and sun_dist.max() < 153e6,
           f"{sun_dist.min() / 1e6:.3f} to {sun_dist.max() / 1e6:.3f} million km (expected 145-153)")

    earth_dist = stored[:, 7]
    report("Earth distance", 355_000 < earth_dist.min() and earth_dist.max() < 408_000,
           f"{earth_dist.min():,.0f} to {earth_dist.max():,.0f} km (expected 355,000-408,000)")

    sub_solar_lat = np.degrees(np.arcsin(stored[:, 2]))
    max_lat = np.abs(sub_solar_lat).max()
    report("max sub-solar latitude", 1.54 <= max_lat <= 1.60,
           f"{max_lat:.4f} deg (expected 1.54-1.60, see docs/kernel_checks.txt)")

    worst = 0.0
    for col in (0, 4):
        exact = table[:, col:col + 3]
        approx = stored[:, col:col + 3]
        cos_angle = np.sum(exact * approx, axis=1) / np.linalg.norm(approx, axis=1)
        worst = max(worst, np.degrees(np.arccos(np.clip(cos_angle, -1.0, 1.0))).max())
    report("Float32 direction precision", worst < 1e-5,
           f"worst error {worst:.1e} deg (limit 1e-5)")

    return ok


def main() -> None:
    load_kernels()
    ets = make_epochs()
    print(f"Computing {len(ets):,} hours from {START_UTC} to {END_UTC} UTC ...")
    table = build_table(ets)
    write_files(ets, table)
    print(f"Wrote {BIN_FILE.relative_to(REPO_ROOT).as_posix()} and {META_FILE.relative_to(REPO_ROOT).as_posix()}")
    if not self_check(ets, table):
        sys.exit(1)


if __name__ == "__main__":
    main()
