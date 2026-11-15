import hashlib
import time
from pathlib import Path

import requests

API_URL = "https://ssd.jpl.nasa.gov/api/horizons.api"
CACHE_DIR = Path(__file__).resolve().parent / "cache" / "horizons"
BODY_CODES = {"SUN": "10", "EARTH": "399"}
MIN_GAP_S = 1.0

_last_request = 0.0


def _params(body: str, lon_deg: float, lat_deg: float, alt_km: float,
            start_utc: str, stop_utc: str, step: str) -> dict:
    return {
        "format": "json",
        "COMMAND": f"'{BODY_CODES[body]}'",
        "OBJ_DATA": "'NO'",
        "MAKE_EPHEM": "'YES'",
        "EPHEM_TYPE": "'OBSERVER'",
        "CENTER": "'coord@301'",
        "COORD_TYPE": "'GEODETIC'",
        "SITE_COORD": f"'{lon_deg % 360.0:.6f},{lat_deg:.6f},{alt_km:.6f}'",  # longitude FIRST
        "START_TIME": f"'{start_utc}'",
        "STOP_TIME": f"'{stop_utc}'",             
        "STEP_SIZE": f"'{step}'",
        "TIME_TYPE": "'UT'",
        "QUANTITIES": "'4'",
        "APPARENT": "'AIRLESS'",
        "ANG_FORMAT": "'DEG'",
        "EXTRA_PREC": "'YES'",
        "CSV_FORMAT": "'YES'",
    }


def _fetch(params: dict) -> str:
    """Return Horizons' text reply, from the cache if we have asked before."""
    global _last_request

    key = hashlib.sha1(repr(sorted(params.items())).encode()).hexdigest()[:16]
    cache_file = CACHE_DIR / f"{key}.txt"
    if cache_file.exists():
        return cache_file.read_text()

    wait = MIN_GAP_S - (time.monotonic() - _last_request)
    if wait > 0:
        time.sleep(wait)
    response = requests.get(API_URL, params=params, timeout=120)
    _last_request = time.monotonic()
    response.raise_for_status()
    text = response.json()["result"]

    if "$$SOE" not in text:
        raise RuntimeError("Horizons returned no table:\n" + text[:1500])

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file.write_text(text)
    return text


def _parse(text: str) -> list[tuple[str, float, float]]:
    """Rows between $$SOE and $$EOE -> (utc, azimuth_deg, elevation_deg)."""
    table = text.split("$$SOE")[1].split("$$EOE")[0]
    rows = []
    for line in table.strip().splitlines():
        parts = line.split(",")
        rows.append((parts[0].strip(), float(parts[3]), float(parts[4])))
    return rows


def az_el_table(body: str, lon_deg: float, lat_deg: float, alt_km: float,
                start_utc: str, stop_utc: str, step: str) -> list[tuple[str, float, float]]:
    """Apparent azimuth and elevation of SUN or EARTH from a Moon site, one row per step."""
    params = _params(body, lon_deg, lat_deg, alt_km, start_utc, stop_utc, step)
    return _parse(_fetch(params))


def moon_from_station_table(lon_deg: float, lat_deg: float, alt_km: float,
                            start_utc: str, stop_utc: str, step: str) -> list[tuple[str, float, float]]:
    """Apparent azimuth and elevation of the Moon from a station on Earth (used by DSN validation)."""
    params = _params("SUN", lon_deg, lat_deg, alt_km, start_utc, stop_utc, step)
    params["COMMAND"] = "'301'"
    params["CENTER"] = "'coord@399'"
    return _parse(_fetch(params))


if __name__ == "__main__":
    for utc, az, el in az_el_table("SUN", 23.47297, 0.67408, 0.002,
                                   "2026-11-14 09:00", "2026-11-14 11:00", "1h"):
        print(f"{utc}  az {az:11.6f}  el {el:10.6f}")
