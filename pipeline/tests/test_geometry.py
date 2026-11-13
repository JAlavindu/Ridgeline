import numpy as np
import pytest
import spiceypy as sp

from geometry import (
    MOON_RADIUS_KM,
    Site,
    angular_radius_deg,
    azimuth_elevation,
    body_view,
    site_position_km,
    sky_view_at,
)
from spice_setup import load_kernels

FAR_KM = 1e12  # far enough that the site's own position does not matter


@pytest.fixture(scope="module", autouse=True)
def kernels():
    load_kernels()

def test_site_radius_includes_heights_in_km():
    site = Site(0.0, 0.0, ground_height_m=1000.0, mast_height_m=2.0)
    assert np.linalg.norm(site_position_km(site)) == pytest.approx(MOON_RADIUS_KM + 1.002)


def test_body_straight_overhead_at_equator():
    site = Site(0.0, 0.0)
    az, el = azimuth_elevation(np.array([FAR_KM, 0.0, 0.0]), site)
    assert el == pytest.approx(90.0, abs=1e-9)


@pytest.mark.parametrize("direction, expected_az", [
    ((0.0, 0.0, 1.0), 0.0),     # towards the Moon's north pole = north
    ((0.0, 1.0, 0.0), 90.0),    # towards +Y = east at longitude 0
    ((0.0, 0.0, -1.0), 180.0),  # south
    ((0.0, -1.0, 0.0), 270.0),  # west
])
def test_compass_directions_on_horizon(direction, expected_az):
    site = Site(0.0, 0.0)
    az, el = azimuth_elevation(np.array(direction), site)
    assert az == pytest.approx(expected_az, abs=1e-9)
    assert el == pytest.approx(0.0, abs=1e-9)


def test_south_pole_azimuth_measured_from_zero_meridian():
    """At 90 S, 'north' is defined as the direction of the 0 deg meridian (plan F4 rule)."""
    pole = Site(-90.0, 0.0)
    az, _ = azimuth_elevation(np.array([1.0, 0.0, 0.0]), pole)
    assert az == pytest.approx(0.0, abs=1e-9)

def test_matches_smooth_moon_formula():
    """sin(e) = sin(lat) sin(b) + cos(lat) cos(b) cos(lon - l) for a very distant body."""
    rng = np.random.default_rng(seed=42)
    for _ in range(500):
        lat, lon = rng.uniform(-90, 90), rng.uniform(-180, 180)
        b, l = rng.uniform(-90, 90), rng.uniform(-180, 180)
        br, lr = np.radians(b), np.radians(l)
        body = FAR_KM * np.array([np.cos(br) * np.cos(lr), np.cos(br) * np.sin(lr), np.sin(br)])

        _, el = azimuth_elevation(body - site_position_km(Site(lat, lon)), Site(lat, lon))

        latr, lonr = np.radians(lat), np.radians(lon)
        expected = np.degrees(np.arcsin(
            np.sin(latr) * np.sin(br) + np.cos(latr) * np.cos(br) * np.cos(lonr - lr)))
        assert el == pytest.approx(expected, abs=1e-6)

@pytest.mark.parametrize("earth_dist_km, expected_drop_deg", [
    (356_400.0, 0.279),
    (406_700.0, 0.245),
])
def test_earth_parallax_on_horizon(earth_dist_km, expected_drop_deg):
    """Earth exactly on the horizon as seen from the Moon's centre appears lower from the surface."""
    site = Site(0.0, 0.0, mast_height_m=0.0)
    earth = np.array([0.0, earth_dist_km, 0.0])
    view = body_view(earth, 6378.137, site)
    assert -view.el_deg == pytest.approx(expected_drop_deg, abs=0.001)

def test_disc_sizes():
    assert 2 * angular_radius_deg(695_700.0, 149_597_870.7) == pytest.approx(0.533, abs=0.001)
    assert 2 * angular_radius_deg(6378.137, 406_700.0) == pytest.approx(1.80, abs=0.01)
    assert 2 * angular_radius_deg(6378.137, 356_400.0) == pytest.approx(2.05, abs=0.01)

@pytest.mark.parametrize("site", [
    Site(0.0, 0.0),                    # equator, Earth-facing
    Site(0.67408, 23.47297),           # Apollo 11
    Site(-80.13, 1.44, 2579.0),        # IM-1 (2.579 km high)
    Site(-89.45, -137.31, 1500.0),     # near Connecting Ridge
    Site(-45.4446, 177.5991),          # Chang'e-4, far side
])
@pytest.mark.parametrize("utc", ["2024-02-23T12:00:00", "2026-11-14T09:00:00", "2031-06-30T18:30:00"])
def test_matches_spice_azlcpo(site, utc):
    et = sp.str2et(utc)
    ours = sky_view_at(site, et)
    obspos = site_position_km(site)
    for target, mine in [("SUN", ours.sun), ("EARTH", ours.earth)]:
        state, _ = sp.azlcpo("ELLIPSOID", target, et, "CN+S", False, True, obspos, "MOON", "MOON_ME")
        spice_az = np.degrees(state[1]) % 360.0
        spice_el = np.degrees(state[2])
        assert mine.el_deg == pytest.approx(spice_el, abs=0.001)
        az_gap = (mine.az_deg - spice_az + 180.0) % 360.0 - 180.0
        assert abs(az_gap) * np.cos(np.radians(mine.el_deg)) < 0.001
