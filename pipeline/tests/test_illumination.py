import numpy as np
import pytest
import spiceypy as sp

from geometry import Site
from illumination import conditions, disc_fraction_above, eclipse_fraction, flat_mask, horizon_at, runs
from spice_setup import load_kernels


@pytest.fixture(scope="module", autouse=True)
def kernels():
    load_kernels()


def test_disc_fraction_half_full_none():
    r = np.array([0.267, 0.267, 0.267])
    assert disc_fraction_above(np.array([0.0, 0.267, -0.267]), r) == pytest.approx([0.5, 1.0, 0.0])


def test_eclipse_fraction_edges():
    assert eclipse_fraction(5.0, 0.267, 0.95) == pytest.approx(1.0)
    assert eclipse_fraction(0.0, 0.267, 0.95) == pytest.approx(0.0)
    assert eclipse_fraction(0.267 + 0.95 - 1e-9, 0.267, 0.95) == pytest.approx(1.0, abs=1e-6)


def test_smooth_moon_horizon_from_2_m_mast():
    assert horizon_at(flat_mask(Site(0.0, 0.0)), np.array([123.0]))[0] == pytest.approx(-0.087, abs=0.001)


def test_mask_wraps_past_360():
    mask = {"az_step_deg": 0.25, "elev_deg": list(np.arange(1440) / 100)}
    assert horizon_at(mask, np.array([359.875]))[0] == pytest.approx((14.39 + 0.0) / 2)
    assert horizon_at(mask, np.array([-0.125]))[0] == pytest.approx(horizon_at(mask, np.array([359.875]))[0])


def test_runs():
    assert runs(np.array([True, True, False, True])) == [(0, 2), (3, 1)]


def test_mid_eclipse_2025_03_14_sun_fully_covered():
    c = conditions(Site(0.0, 0.0), np.array([sp.str2et("2025-03-14T07:00:00")]))
    assert c["eclipse_fraction"][0] == 0.0
    assert c["sun_fraction"][0] == 0.0
