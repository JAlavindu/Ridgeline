from datetime import datetime, timezone

import pytest
import spiceypy as sp

from spice_setup import load_kernels

# Browser formula (web/src/engine/time.ts): tdb_s = unix_seconds - BROWSER_OFFSET_S.
# 946,727,930.816 = J2000 epoch in Unix seconds (946,728,000) minus TDB-UTC (69.184 s).
# Valid only while no new leap second is added (true since 2017-01-01).
BROWSER_OFFSET_S = 946_727_930.816
TOLERANCE_S = 0.002


@pytest.fixture(scope="module", autouse=True)
def kernels():
    load_kernels()


def browser_tdb(utc: datetime) -> float:
    return utc.timestamp() - BROWSER_OFFSET_S


def test_anchor_2026_11_14():
    utc = datetime(2026, 11, 14, 9, 0, 0, tzinfo=timezone.utc)
    assert browser_tdb(utc) == pytest.approx(847_918_869.184, abs=1e-6)
    assert sp.str2et("2026-11-14T09:00:00") == pytest.approx(847_918_869.184, abs=TOLERANCE_S)


@pytest.mark.parametrize("year", range(2023, 2033))
@pytest.mark.parametrize("month", [1, 4, 7, 10])
def test_browser_formula_matches_spice(year, month):
    utc = datetime(year, month, 1, tzinfo=timezone.utc)
    spice = sp.str2et(utc.strftime("%Y-%m-%dT%H:%M:%S"))
    assert browser_tdb(utc) == pytest.approx(spice, abs=TOLERANCE_S)


def test_round_trip():
    text = "2029-09-23T14:00:00.000"
    assert sp.et2utc(sp.str2et(text), "ISOC", 3) == text


def test_formula_is_wrong_before_2017_leap_second():
    """Documents the limit: before the 2016-12-31 leap second, TDB-UTC was 68.184 s."""
    utc = datetime(2016, 6, 1, tzinfo=timezone.utc)
    spice = sp.str2et(utc.strftime("%Y-%m-%dT%H:%M:%S"))
    assert browser_tdb(utc) - spice == pytest.approx(1.0, abs=TOLERANCE_S)
