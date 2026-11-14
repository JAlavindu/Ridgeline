"""DSN mode (module 12): how high is the Moon in the sky of each Deep Space Network site?

For every 10 minutes from 2023 to 2033, SPICE gives the Moon's elevation above the local
horizon at Goldstone (DSS-14), Madrid (DSS-63) and Canberra (DSS-43). The browser combines
this with "Earth visible from the lander": contact needs both.

Output (web/public/data/): dsn.bin  (Int16, little endian, 3 values per step, hundredths of a degree)
                           dsn_meta.json
Needs the extra kernels: python pipeline/get_kernels.py --dsn
Run: python pipeline/dsn.py
"""
import json
from pathlib import Path

import numpy as np
import spiceypy as sp

from spice_setup import DSN_KERNEL_FILES, KERNEL_FILES, load_dsn_kernels

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "web" / "public" / "data"
BIN_FILE = DATA_DIR / "dsn.bin"
META_FILE = DATA_DIR / "dsn_meta.json"

START_UTC = "2023-01-01T00:00:00"
END_UTC = "2033-01-01T00:00:00"
STEP_S = 600.0          # Earth turns 15 deg/hour, so hourly steps would be too coarse for 6-13.6 deg limits
SCALE = 100             # stored as hundredths of a degree
STATIONS = [
    {"id": "DSS-14", "name": "Goldstone (USA)", "naif_id": 399014},
    {"id": "DSS-63", "name": "Madrid (Spain)", "naif_id": 399063},
    {"id": "DSS-43", "name": "Canberra (Australia)", "naif_id": 399043},
]


def make_epochs() -> np.ndarray:
    start, end = sp.str2et(START_UTC), sp.str2et(END_UTC)
    return start + STEP_S * np.arange(round((end - start) / STEP_S) + 1)


def moon_elevation_deg(ets: np.ndarray, station: dict) -> np.ndarray:
    """Elevation of the Moon above the station's horizon (no refraction), in degrees."""
    pos, _ = sp.spkpos("MOON", ets, f"{station['id']}_TOPO", "CN+S", str(station["naif_id"]))
    pos = np.array(pos)
    return np.degrees(np.arcsin(pos[:, 2] / np.linalg.norm(pos, axis=1)))


def station_geodetic(station: dict, et: float) -> tuple[float, float, float]:
    """(lon_deg, lat_deg, alt_km) from the kernel's own station position, for the Horizons check."""
    pos, _ = sp.spkpos(str(station["naif_id"]), et, "ITRF93", "NONE", "399")
    lon, lat, alt = sp.recgeo(pos, 6378.137, 1.0 / 298.257223563)
    return float(np.degrees(lon)), float(np.degrees(lat)), float(alt)


def build(ets: np.ndarray) -> np.ndarray:
    columns = [np.round(moon_elevation_deg(ets, s) * SCALE) for s in STATIONS]
    return np.column_stack(columns).astype("<i2")


def main() -> None:
    load_dsn_kernels()
    ets = make_epochs()
    table = build(ets)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    BIN_FILE.write_bytes(table.tobytes())
    meta = {
        "description": "Elevation of the Moon above the horizon at each Deep Space Network complex",
        "start_utc": START_UTC + "Z",
        "start_tdb_s": float(ets[0]),
        "step_s": STEP_S,
        "count": int(len(ets)),
        "values_per_record": len(STATIONS),
        "stations": STATIONS,
        "dtype": "int16",
        "byte_order": "little",
        "scale": SCALE,
        "unit": "degrees = value / scale",
        "light_time": "CN+S",
        "refraction": "none (airless)",
        "limits_deg": {"receive": 6.0, "command_low": 10.1, "command_high": 13.6},
        "limits_source": "DSN 810-005, Rev. O",
        "kernels": KERNEL_FILES + DSN_KERNEL_FILES,
    }
    META_FILE.write_text(json.dumps(meta, indent=2) + "\n")
    print(f"Wrote {BIN_FILE.name} ({BIN_FILE.stat().st_size:,} bytes, {len(ets):,} steps) and {META_FILE.name}")
    for i, s in enumerate(STATIONS):
        e = table[:, i] / SCALE
        print(f"  {s['id']} {s['name']}: Moon above 6 deg {100 * np.mean(e >= 6):.1f}% of the time, max {e.max():.1f}")
    any_up = (table / SCALE >= 6).any(axis=1)
    print(f"  at least one station sees the Moon above 6 deg: {100 * any_up.mean():.1f}% of the time")


if __name__ == "__main__":
    main()
