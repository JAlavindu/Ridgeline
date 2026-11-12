import numpy as np
from terrain import R, sample_chain

def angle_exact(s, h_terr, h_site, h_obs=2.0):            # F9
    th = s / R
    r1, r2 = R + h_site + h_obs, R + h_terr
    return np.degrees(np.arctan2(r2 * np.cos(th) - r1, r2 * np.sin(th)))

def ray_distances(s0, s1, pix):
    s, out = s0, []
    while s <= s1:
        out.append(s); s += max(pix, 0.01 * s)
    return np.array(out)

def dest_points(lat, lon, az_deg, s):                     # F10, true great circles
    lat = max(lat, -89.999999)       # at the exact pole azimuth is measured from this lon's meridian
    th, az = (s / R)[None, :], np.radians(az_deg)[:, None]
    p1, l1 = np.radians(lat), np.radians(lon)
    p2 = np.arcsin(np.sin(p1) * np.cos(th) + np.cos(p1) * np.sin(th) * np.cos(az))
    l2 = l1 + np.arctan2(np.sin(az) * np.sin(th) * np.cos(p1), np.cos(th) - np.sin(p1) * np.sin(p2))
    return np.degrees(l2), np.degrees(p2)

def horizon(lat, lon, rings, az, h_obs=2.0):
    """rings = [([finest, ..., coarsest], s_min_m, s_max_m), ...] nearest ring first."""
    h_site = sample_chain(rings[0][0], np.array([lon]), np.array([max(lat, -89.999999)]))[0]
    best = np.full(len(az), -90.0)
    for dems, s0, s1 in rings:
        pix = dems[0].src.res[0]
        s = ray_distances(max(s0, pix), s1, pix)
        lon2, lat2 = dest_points(lat, lon, az, s)
        h = sample_chain(dems, lon2, lat2)
        ang = angle_exact(s[None, :], h, h_site, h_obs)
        with np.errstate(all="ignore"):
            best = np.fmax(best, np.nanmax(ang, axis=1))
    return best, h_site
