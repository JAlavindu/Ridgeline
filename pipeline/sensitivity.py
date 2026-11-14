"""Sensitivity tests S1-S3 (M1): how much do our modelling choices matter?

S1  How far a 0.1 deg horizon error moves a sunset, against the plan's formula F8.
S2  Earth visibility under the 'centre' rule vs the 'any part' rule (decision D7).
S3  Whether hourly sampling changes the decade-average sunlight (so V9 and V10 are not a step artefact).

Each run_* function returns a validation.json entry; validate.py calls them.
"""
import numpy as np
import spiceypy as sp

from geometry import Site
from illumination import conditions, sky_arrays
from replays import load_site

START_UTC = "2026-11-14T09:00:00"
DECADE = ("2023-01-01T00:00:00", "2033-01-01T00:00:00")
HORIZON_ERROR_DEG = 0.1


def _first_sunset_s(site: Site, raise_deg: float, t0: float, hours: int = 24 * 400) -> float | None:
    """TDB time of the first sunset after t0 (Sun's disc fully below a flat horizon raised by raise_deg)."""
    dip = float(np.degrees(np.arccos(1737.4 / (1737.4 + site.mast_height_m / 1000.0))))
    horizon = -dip + raise_deg

    def gap(et: float) -> float:
        s = sky_arrays(site, np.array([et]))
        return float(s["sun_el"][0] + s["sun_radius"][0] - horizon)   # > 0: some of the disc is above

    ets = t0 + 3600.0 * np.arange(hours)
    s = sky_arrays(site, ets)
    g = s["sun_el"] + s["sun_radius"] - horizon
    crossing = np.flatnonzero((g[:-1] > 0) & (g[1:] <= 0))
    if crossing.size == 0:
        return None
    lo, hi = float(ets[crossing[0]]), float(ets[crossing[0] + 1])
    for _ in range(40):                                              # bisect to well under a second
        mid = 0.5 * (lo + hi)
        lo, hi = (mid, hi) if gap(mid) > 0 else (lo, mid)
    return 0.5 * (lo + hi)


def _sun_height_rate_deg_per_h(site: Site, et: float) -> float:
    s = sky_arrays(site, np.array([et - 60.0, et + 60.0]))
    return float((s["sun_el"][1] - s["sun_el"][0]) / 120.0 * 3600.0)


def run_s1() -> dict:
    t0 = sp.str2et(START_UTC)
    rows = {}
    worst_error = 0.0
    for lat in (0.0, -80.0, -85.0, -89.0):
        site = Site(lat, 0.0)
        base = _first_sunset_s(site, 0.0, t0)
        if base is None:
            rows[f"{lat:g}"] = {"result": "no sunset in 400 days"}
            continue
        # The same sunset with the horizon 0.1 deg higher: the nearest later crossing
        raised = _first_sunset_s(site, HORIZON_ERROR_DEG, base - 3 * 86400.0)
        rate = _sun_height_rate_deg_per_h(site, base)
        predicted_h = HORIZON_ERROR_DEG / abs(rate)
        measured_h = abs(base - raised) / 3600.0 if raised is not None else None
        error = abs(measured_h - predicted_h) / predicted_h if measured_h is not None else None
        rows[f"{lat:g}"] = {
            "sunset_utc": sp.et2utc(base, "ISOC", 0) + "Z",
            "sun_height_rate_deg_per_h": round(rate, 4),
            "predicted_shift_h": round(predicted_h, 2),
            "measured_shift_h": None if measured_h is None else round(measured_h, 2),
            "relative_error": None if error is None else round(error, 3),
        }
        worst_error = max(worst_error, error if error is not None else 1.0)
    ok = worst_error <= 0.10 and all("measured_shift_h" in r for r in rows.values())
    print(f"  S1 horizon error vs countdown: worst gap to F8 {100 * worst_error:.1f}%")
    summary = ", ".join(f"{k} deg: {v.get('measured_shift_h')} h" for k, v in rows.items())
    return {
        "id": "S1",
        "name": "A 0.1 deg horizon error vs sunset time (formula F8)",
        "what": ("Smooth Moon, 2 m mast, first sunset (within 400 days) after 2026-11-14 09:00 UTC at latitudes 0, 80 S, 85 S and 89 S. "
                 "The sunset time is found again with the horizon raised by 0.1 deg. F8 predicts a shift of "
                 "0.1 deg divided by the Sun's rate of change of height."),
        "tolerance": "measured shift within 10% of the F8 prediction at every latitude",
        "result": round(100 * worst_error, 1),
        "unit": "% (worst gap between measured shift and F8)",
        "expected_outcome": "pass",
        "outcome": "pass" if ok else "fail",
        "explanation": (f"Shift per 0.1 deg of horizon error: {summary}. This is why poleward of 75 deg the app shows a "
                        "window and never a single sunset time."),
        "details": rows,
    }


def run_s2() -> dict:
    ets = sp.str2et(DECADE[0]) + 3600.0 * np.arange(round((sp.str2et(DECADE[1]) - sp.str2et(DECADE[0])) / 3600) + 1)
    t0 = sp.str2et(START_UTC)
    near = t0 + 600.0 * np.arange(60 * 144)
    rows, ok = {}, True
    for site_id in ("connecting_ridge", "shackleton_site004", "malapert_massif"):
        site, mask, horizon = load_site(site_id)
        c = conditions(site, ets, mask)
        centre, any_part = float(np.mean(c["earth_margin_centre"] > 0)) * 100, float(np.mean(c["earth_margin_any_part"] > 0)) * 100
        n = conditions(site, near, mask)

        def first_set(margin: np.ndarray) -> float | None:
            idx = np.flatnonzero((margin[:-1] > 0) & (margin[1:] <= 0))
            return None if idx.size == 0 else float(near[idx[0] + 1])

        a, b = first_set(n["earth_margin_centre"]), first_set(n["earth_margin_any_part"])
        rows[site_id] = {
            "horizon": horizon,
            "earth_visible_centre_percent": round(centre, 2),
            "earth_visible_any_part_percent": round(any_part, 2),
            "difference_points": round(any_part - centre, 2),
            "first_earthset_centre_utc": None if a is None else sp.et2utc(a, "ISOC", 0) + "Z",
            "first_earthset_any_part_utc": None if b is None else sp.et2utc(b, "ISOC", 0) + "Z",
            "earthset_later_by_h": None if a is None or b is None else round((b - a) / 3600.0, 2),
        }
        ok = ok and any_part >= centre
    worst = max(r["difference_points"] for r in rows.values())
    print(f"  S2 Earth rule: any-part vs centre differ by up to {worst:.2f} points")
    return {
        "id": "S2",
        "name": "Earth visibility: centre rule vs any-part rule",
        "what": ("Share of the decade 2023-2032 (hourly) with Earth visible, at three polar sites with LOLA terrain, "
                 "under the default centre rule and the any-part rule that NASA PGDA 69 uses. Also the first "
                 "Earthset after 2026-11-14 09:00 UTC under each rule."),
        "tolerance": "any-part is never less than centre (sanity check); the size of the difference is reported",
        "result": round(worst, 2),
        "unit": "points (largest any-part minus centre)",
        "expected_outcome": "pass",
        "outcome": "pass" if ok else "fail",
        "explanation": ("The choice of rule changes the visibility percentage and the Earthset time near the pole, which "
                        "is why the rule is shown on screen and why V9 must use the any-part rule."),
        "details": rows,
    }


def run_s3() -> dict:
    start, end = sp.str2et(DECADE[0]), sp.str2et(DECADE[1])
    site, mask, _ = load_site("connecting_ridge")
    means = {}
    for label, step in (("60 min", 3600.0), ("10 min", 600.0)):
        ets = start + step * np.arange(round((end - start) / step) + 1)
        means[label] = float(conditions(site, ets, mask)["sun_fraction"].mean()) * 100
    gap = abs(means["60 min"] - means["10 min"])
    print(f"  S3 sampling step: 60 min {means['60 min']:.2f}% vs 10 min {means['10 min']:.2f}%")
    return {
        "id": "S3",
        "name": "Decade average sunlight: hourly vs 10-minute sampling",
        "what": "Connecting Ridge, 2 m mast, LOLA terrain, 2023-2032, sampled every 60 and every 10 minutes.",
        "tolerance": "the two averages differ by less than 0.2 points",
        "result": round(gap, 3),
        "unit": "points (difference between the two averages)",
        "expected_outcome": "pass",
        "outcome": "pass" if gap < 0.2 else "fail",
        "explanation": (f"60 min: {means['60 min']:.2f}%, 10 min: {means['10 min']:.2f}%. The hourly sampling used by V10 "
                        "and V9 does not change the answer."),
        "details": {k: round(v, 3) for k, v in means.items()},
    }
