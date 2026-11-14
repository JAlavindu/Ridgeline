import json
from pathlib import Path

import numpy as np
import spiceypy as sp

from geometry import EARTH_RADIUS_KM, MOON_RADIUS_KM, SUN_RADIUS_KM, Site, local_axes, site_position_km

MASK_DIR = Path(__file__).resolve().parent.parent / "web" / "public" / "data" / "masks"


def sky_arrays(site: Site, ets: np.ndarray) -> dict[str, np.ndarray]:
    """Sun and Earth azimuth, elevation, distance and disc radius (deg, km) at every time in ets."""
    sun = np.array(sp.spkpos("SUN", ets, "MOON_ME", "CN+S", "MOON")[0])
    earth = np.array(sp.spkpos("EARTH", ets, "MOON_ME", "CN+S", "MOON")[0])
    origin = site_position_km(site)
    east, north, up = local_axes(site)

    out = {}
    for name, pos, radius in (("sun", sun, SUN_RADIUS_KM), ("earth", earth, EARTH_RADIUS_KM)):
        v = pos - origin                                   # F3, every row at once
        dist = np.linalg.norm(v, axis=1)
        out[f"{name}_az"] = np.degrees(np.arctan2(v @ east, v @ north)) % 360.0
        out[f"{name}_el"] = np.degrees(np.arcsin(np.clip((v @ up) / dist, -1.0, 1.0)))
        out[f"{name}_dist"] = dist
        out[f"{name}_radius"] = np.degrees(np.arcsin(radius / dist))

    s, e = sun - origin, earth - origin
    cross = np.linalg.norm(np.cross(s, e), axis=1)
    out["separation"] = np.degrees(np.arctan2(cross, np.sum(s * e, axis=1)))
    return out


def flat_mask(site: Site, az_step_deg: float = 0.25) -> dict:
    """Smooth-Moon horizon from mast height: acos(R / (R + h)) below level, in every direction."""
    height_km = site.mast_height_m / 1000.0
    dip = np.degrees(np.arccos(MOON_RADIUS_KM / (MOON_RADIUS_KM + height_km)))
    return {"az_step_deg": az_step_deg, "elev_deg": [-dip] * round(360 / az_step_deg)}


def load_mask(site_id: str) -> dict:
    """M3's horizon mask, web/public/data/masks/<site_id>.json."""
    return json.loads((MASK_DIR / f"{site_id}.json").read_text())


def horizon_at(mask: dict, az_deg: np.ndarray) -> np.ndarray:
    """Terrain height (deg) at each azimuth, blending the two nearest samples; wraps past 360."""
    elev = np.asarray(mask["elev_deg"], dtype=float)
    n = len(elev)
    position = (np.mod(az_deg, 360.0) / mask["az_step_deg"]) % n
    i = np.floor(position).astype(int)
    f = position - i
    return (1 - f) * elev[i % n] + f * elev[(i + 1) % n]


def sun_above_horizon_deg(sun_az: np.ndarray, sun_el: np.ndarray, mask: dict) -> np.ndarray:
    """Signed distance from the Sun's centre to the (possibly sloping) horizon line, in degrees."""
    step = mask["az_step_deg"]
    gap = sun_el - horizon_at(mask, sun_az)
    rise_per_deg = (horizon_at(mask, sun_az + step) - horizon_at(mask, sun_az - step)) / (2 * step)
    slope = rise_per_deg / np.maximum(np.cos(np.radians(sun_el)), 0.01)
    return gap / np.sqrt(1 + slope**2)


def disc_fraction_above(above_deg: np.ndarray, radius_deg: np.ndarray) -> np.ndarray:
    """F11: fraction of a disc above a straight line its centre is `above_deg` over."""
    x = np.clip(above_deg / radius_deg, -1.0, 1.0)
    hidden = (np.arccos(x) - x * np.sqrt(1 - x * x)) / np.pi
    return 1.0 - hidden


def eclipse_fraction(sep_deg: np.ndarray, sun_r: np.ndarray, earth_r: np.ndarray) -> np.ndarray:
    """F12: fraction of the Sun NOT covered by Earth (1 = no eclipse, 0 = fully hidden)."""
    d, rs, re = np.broadcast_arrays(np.asarray(sep_deg, float), sun_r, earth_r)
    out = np.ones_like(d)
    full = d <= re - rs
    part = ~full & (d < rs + re)
    out[full] = 0.0

    d, rs, re = d[part], rs[part], re[part]
    overlap = (
        rs**2 * np.arccos((d**2 + rs**2 - re**2) / (2 * d * rs))
        + re**2 * np.arccos((d**2 + re**2 - rs**2) / (2 * d * re))
        - 0.5 * np.sqrt((-d + rs + re) * (d + rs - re) * (d - rs + re) * (d + rs + re))
    )
    out[part] = 1.0 - overlap / (np.pi * rs**2)
    return out


def conditions(site: Site, ets: np.ndarray, mask: dict | None = None) -> dict[str, np.ndarray]:
    """Everything validate.py needs, for every time in ets. mask=None means smooth Moon."""
    mask = mask or flat_mask(site)
    sky = sky_arrays(site, ets)
    terrain = disc_fraction_above(sun_above_horizon_deg(sky["sun_az"], sky["sun_el"], mask), sky["sun_radius"])
    eclipse = eclipse_fraction(sky["separation"], sky["sun_radius"], sky["earth_radius"])
    earth_horizon = horizon_at(mask, sky["earth_az"])
    return {
        **sky,
        "terrain_fraction": terrain,
        "eclipse_fraction": eclipse,
        "sun_fraction": np.minimum(terrain, eclipse),
        "earth_margin_centre": sky["earth_el"] - earth_horizon,
        "earth_margin_any_part": sky["earth_el"] + sky["earth_radius"] - earth_horizon,
    }


def runs(flags: np.ndarray) -> list[tuple[int, int]]:
    """(start, length) of every run of True values."""
    padded = np.concatenate([[False], flags, [False]])
    edges = np.flatnonzero(padded[1:] != padded[:-1])
    starts, ends = edges[::2], edges[1::2]
    return list(zip(starts.tolist(), (ends - starts).tolist()))
