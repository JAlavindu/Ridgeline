import json

import numpy as np
import pytest
import spiceypy as sp

import dsn
from spice_setup import KERNEL_DIR, DSN_KERNEL_FILES, load_dsn_kernels

pytestmark = pytest.mark.skipif(
    not all((KERNEL_DIR / name).exists() for name in DSN_KERNEL_FILES),
    reason="DSN kernels not downloaded (python pipeline/get_kernels.py --dsn)",
)


@pytest.fixture(scope="module", autouse=True)
def kernels():
    load_dsn_kernels()


def test_files_match_their_description():
    meta = json.loads(dsn.META_FILE.read_text())
    assert meta["count"] == 526_033
    assert dsn.BIN_FILE.stat().st_size == meta["count"] * meta["values_per_record"] * 2
    assert [s["id"] for s in meta["stations"]] == ["DSS-14", "DSS-63", "DSS-43"]


def test_station_positions_are_goldstone_madrid_canberra():
    et = sp.str2et("2026-11-14T00:00:00")
    lon, lat, alt = dsn.station_geodetic(dsn.STATIONS[0], et)
    assert (lon, lat) == pytest.approx((-116.89, 35.43), abs=0.02)
    lon, lat, _ = dsn.station_geodetic(dsn.STATIONS[1], et)
    assert (lon, lat) == pytest.approx((-4.25, 40.43), abs=0.02)
    lon, lat, _ = dsn.station_geodetic(dsn.STATIONS[2], et)
    assert (lon, lat) == pytest.approx((148.98, -35.40), abs=0.02)


def test_moon_is_above_the_horizon_about_half_the_time():
    ets = sp.str2et("2026-01-01T00:00:00") + 600.0 * np.arange(6 * 24 * 28)
    for station in dsn.STATIONS:
        share = np.mean(dsn.moon_elevation_deg(ets, station) > 0)
        assert 0.4 < share < 0.6


def test_shipped_file_matches_a_fresh_calculation():
    meta = json.loads(dsn.META_FILE.read_text())
    table = np.frombuffer(dsn.BIN_FILE.read_bytes(), dtype="<i2").reshape(-1, 3)
    index = 123_456
    et = meta["start_tdb_s"] + index * meta["step_s"]
    fresh = [float(dsn.moon_elevation_deg(np.array([et]), s)[0]) for s in dsn.STATIONS]
    assert table[index] / meta["scale"] == pytest.approx(fresh, abs=0.006)
