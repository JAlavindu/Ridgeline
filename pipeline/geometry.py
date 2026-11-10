from dataclasses import dataclass

import numpy as np
import spiceypy as sp

MOON_RADIUS_KM = 1737.4
SUN_RADIUS_KM = 695_700.0
EARTH_RADIUS_KM = 6378.137
DEFAULT_MAST_M = 2.0


@dataclass
class Site:
    lat_deg: float
    lon_deg: float
    ground_height_m: float = 0.0
    mast_height_m: float = DEFAULT_MAST_M


@dataclass
class BodyView:
    az_deg: float
    el_deg: float
    dist_km: float
    angular_radius_deg: float


@dataclass
class SkyView:
    sun: BodyView
    earth: BodyView
    sun_earth_separation_deg: float


def site_position_km(site: Site) -> np.ndarray:
    """F1: the site's position from the Moon's centre, in km (MOON_ME)."""
    lat = np.radians(site.lat_deg)
    lon = np.radians(site.lon_deg)
    radius = MOON_RADIUS_KM + (site.ground_height_m + site.mast_height_m) / 1000.0
    return radius * np.array([
        np.cos(lat) * np.cos(lon),
        np.cos(lat) * np.sin(lon),
        np.sin(lat),
    ])


def local_axes(site: Site) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """F2: unit vectors pointing east, north and up at the site."""
    lat = np.radians(site.lat_deg)
    lon = np.radians(site.lon_deg)
    east = np.array([-np.sin(lon), np.cos(lon), 0.0])
    north = np.array([
        -np.sin(lat) * np.cos(lon),
        -np.sin(lat) * np.sin(lon),
        np.cos(lat),
    ])
    up = np.array([
        np.cos(lat) * np.cos(lon),
        np.cos(lat) * np.sin(lon),
        np.sin(lat),
    ])
    return east, north, up


def azimuth_elevation(v: np.ndarray, site: Site) -> tuple[float, float]:
    """F4: azimuth and elevation in degrees of direction v (km, MOON_ME) seen from the site."""
    east, north, up = local_axes(site)
    az = np.degrees(np.arctan2(np.dot(east, v), np.dot(north, v))) % 360.0
    el = np.degrees(np.arcsin(np.dot(up, v) / np.linalg.norm(v)))
    return float(az), float(el)


def angular_radius_deg(body_radius_km: float, dist_km: float) -> float:
    """F15: half the apparent width of a body's disc, in degrees."""
    return float(np.degrees(np.arcsin(body_radius_km / dist_km)))


def angle_between_deg(a: np.ndarray, b: np.ndarray) -> float:
    """Angle between two vectors in degrees (numerically safe for tiny angles)."""
    return float(np.degrees(np.arctan2(np.linalg.norm(np.cross(a, b)), np.dot(a, b))))


def body_view(body_pos_km: np.ndarray, body_radius_km: float, site: Site) -> BodyView:
    """F3 + F4 + F15 for one body whose position is given from the Moon's centre."""
    v = body_pos_km - site_position_km(site)
    az, el = azimuth_elevation(v, site)
    dist = float(np.linalg.norm(v))
    return BodyView(az, el, dist, angular_radius_deg(body_radius_km, dist))


def sky_view(site: Site, sun_pos_km: np.ndarray, earth_pos_km: np.ndarray) -> SkyView:
    """Sun and Earth as seen from the site, from Moon-centred positions (km, MOON_ME)."""
    origin = site_position_km(site)
    separation = angle_between_deg(sun_pos_km - origin, earth_pos_km - origin)
    return SkyView(
        sun=body_view(sun_pos_km, SUN_RADIUS_KM, site),
        earth=body_view(earth_pos_km, EARTH_RADIUS_KM, site),
        sun_earth_separation_deg=separation,
    )


def sky_view_at(site: Site, et: float) -> SkyView:
    """Same as sky_view, asking SPICE for the positions. Kernels must be loaded first."""
    sun, _ = sp.spkpos("SUN", et, "MOON_ME", "CN+S", "MOON")
    earth, _ = sp.spkpos("EARTH", et, "MOON_ME", "CN+S", "MOON")
    return sky_view(site, np.array(sun), np.array(earth))


if __name__ == "__main__":
    from spice_setup import load_kernels

    load_kernels()
    apollo11 = Site(lat_deg=0.67408, lon_deg=23.47297)
    view = sky_view_at(apollo11, sp.str2et("2026-11-14T09:00:00"))
    print("Apollo 11 site, 2026-11-14 09:00 UTC")
    print(f"  Sun:   az {view.sun.az_deg:7.3f}  el {view.sun.el_deg:7.3f}")
    print(f"  Earth: az {view.earth.az_deg:7.3f}  el {view.earth.el_deg:7.3f}  "
          f"dist {view.earth.dist_km:,.0f} km")
    print(f"  Sun-Earth separation {view.sun_earth_separation_deg:.3f} deg")
