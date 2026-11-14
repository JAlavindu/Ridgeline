"""Mission replays (module 11): re-run real landings and write web/public/data/replays.json.

These are plausibility checks and stories, not proof: landers stop for many reasons.
The browser recomputes IM-1, Chandrayaan-3 and IM-2 live from ephem.bin. Python computes the
same windows independently (used by V11-V13 in validate.py, and to cross-check the browser
in web/src/engine/tests/replay.test.ts). Apollo 11 (1969) is outside the ephemeris file, so it
is computed here only.

Run:  python pipeline/replays.py
"""
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import spiceypy as sp

from geometry import Site, sky_view_at
from illumination import conditions, load_mask, runs
from spice_setup import load_kernels

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "web" / "public" / "data"
OUT_FILE = DATA_DIR / "replays.json"
STEP_S = 600.0
PLAN = "Ridgeline build plan, M2 section 15 (not yet checked against a primary source)"

NOTE = ("Plausibility check, not proof. Landers stop for many reasons besides sunset, so the end of "
        "operations is shown beside the computed Sun, never called a sunset.")

# Each mission: where, when, and the known facts to print beside the computed numbers.
MISSIONS = [
    {
        "id": "im1",
        "name": "IM-1 Odysseus",
        "site_ids": ["im1"],
        "window": ("2024-02-22T00:00:00", "2024-03-06T00:00:00"),
        "landing_utc": "2024-02-22T23:24:00",
        "ops_end_utc": "2024-02-29T00:00:00",
        "ops_end_label": "Operations ended (about 29 Feb)",
        "facts": [
            {"text": "Landed 22 Feb 2024 at about 23:24 UTC.", "source": PLAN},
            {"text": "Tipped over (about 30 degrees) on a slope, so its panels lost the Sun before the terrain did.",
             "source": PLAN},
            {"text": "Operations ended on about 29 Feb 2024.", "source": PLAN},
        ],
    },
    {
        "id": "chandrayaan3",
        "name": "Chandrayaan-3 Vikram",
        "site_ids": ["chandrayaan3_isro", "chandrayaan3_lroc"],
        "window": ("2023-08-23T00:00:00", "2023-09-26T00:00:00"),
        "landing_utc": "2023-08-23T12:33:00",
        "ops_end_utc": "2023-09-04T00:00:00",
        "ops_end_label": "Put to sleep (about 4 Sep)",
        "expected_sunrise_utc": "2023-09-22T00:00:00",
        "facts": [
            {"text": "Landed 23 Aug 2023 at about 12:33 UTC.", "source": PLAN},
            {"text": "Put to sleep on 4 Sep 2023. ISRO expected the Sun to return around 22 Sep.", "source": PLAN},
            {"text": "ISRO and LROC coordinates for the touchdown point differ by about 360 m; both are shown.",
             "source": PLAN},
        ],
    },
    {
        "id": "im2",
        "name": "IM-2 Athena",
        "site_ids": ["im2"],
        "window": ("2025-03-06T00:00:00", "2025-03-21T00:00:00"),
        "landing_utc": "2025-03-06T17:28:00",
        "ops_end_utc": "2025-03-07T06:28:00",
        "ops_end_label": "Operations ended (about 13 h after landing)",
        "eclipse_window_utc": ("2025-03-14T06:26:00", "2025-03-14T07:31:00"),
        "facts": [
            {"text": "Landed 6 Mar 2025, on its side in a shadowed crater.", "source": PLAN},
            {"text": "Operations ended within about 13 hours of landing, so the 14 Mar eclipse on this "
                     "timeline is geometry only, not a cause.", "source": PLAN},
        ],
    },
]

# The app's site ids (web/src/data/lunarSites.ts) differ from sites.json ids
APP_IDS = {"im1": "im-1", "chandrayaan3_isro": "chandrayaan-3", "chandrayaan3_lroc": "chandrayaan3-lroc",
           "im2": "im-2", "apollo11": "apollo-11"}


def site_info(site_id: str) -> dict:
    site, _ = load_site(site_id)
    return {"app_id": APP_IDS[site_id], "lat": site.lat_deg, "lon": site.lon_deg,
            "height_m": site.ground_height_m, "mask": site_id}


APOLLO11 = {
    "id": "apollo11",
    "name": "Apollo 11 Tranquility Base",
    "site_ids": ["apollo11"],
    "landing_utc": "1969-07-20T20:17:40",
    "planned_sun_el_deg": 10.8,
    "planned_earth_el_deg": 60.0,
    "facts": [
        {"text": "Touchdown 20 Jul 1969 at 20:17:40 UTC. NASA planned a Sun about 10.8 degrees high so that "
                 "long shadows showed the terrain, and Earth about 60 degrees high.", "source": PLAN},
        {"text": "1969 is before the app's ephemeris (2023-2032), so these numbers were computed offline in Python.",
         "source": "pipeline/replays.py"},
    ],
}


def parse(utc: str) -> datetime:
    return datetime.strptime(utc, "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)


def iso(moment: datetime) -> str:
    return moment.strftime("%Y-%m-%dT%H:%M:%SZ")


def et_of(utc: str) -> float:
    return sp.str2et(utc)


def load_site(site_id: str) -> tuple[Site, dict]:
    sites = {s["id"]: s for s in json.loads((DATA_DIR / "sites.json").read_text())}
    s = sites[site_id]
    mask = load_mask(site_id)
    return Site(s["lat"], s["lon"], mask.get("site_height_m") or 0.0, 2.0), mask


def analyse(site_id: str, start: str, stop: str, landing: str) -> dict:
    """Sunlight, dark periods, eclipse and Earth margin for one site over one window."""
    site, mask = load_site(site_id)
    ets = np.arange(et_of(start), et_of(stop), STEP_S)
    c = conditions(site, ets, mask)
    fraction = c["sun_fraction"]
    utc_of = lambda i: iso(parse(start) + timedelta(seconds=STEP_S * int(i)))  # noqa: E731

    landing_index = int((et_of(landing) - ets[0]) // STEP_S)
    dark = []
    for first, length in runs(fraction == 0):
        end_index = min(first + length, len(ets) - 1)
        dark.append({"from": utc_of(first), "to": utc_of(end_index), "hours": round(length * STEP_S / 3600, 1),
                     "ends_in_window": first + length < len(ets)})
    eclipse = c["eclipse_fraction"]
    sun_el = c["sun_el"]
    return {
        "site_id": site_id,
        "sun_fraction_at_landing": round(float(fraction[landing_index]), 3),
        "mean_sun_fraction": round(float(fraction.mean()), 3),
        "dark_periods": dark,
        "eclipse_min_fraction": round(float(eclipse.min()), 3),
        "eclipse_min_utc": utc_of(int(eclipse.argmin())),
        "earth_margin_min_deg": round(float(c["earth_margin_centre"].min()), 2),
        "earth_margin_max_deg": round(float(c["earth_margin_centre"].max()), 2),
        "sun_el_daily_deg": daily_sun_elevation(ets, sun_el),
    }


def daily_sun_elevation(ets: np.ndarray, sun_el: np.ndarray) -> dict:
    """Sun elevation at the start of each whole day (used to judge ISRO's 'expected sunrise')."""
    out = {}
    for index in range(0, len(ets), 144):  # 144 ten-minute steps = 1 day
        out[sp.et2utc(ets[index], "ISOC", 0) + "Z"] = round(float(sun_el[index]), 2)
    return out


def first_dark_after(analysis: dict, after_utc: str) -> dict | None:
    """The first dark period that starts after `after_utc`."""
    for period in analysis["dark_periods"]:
        if period["from"] >= after_utc[:19] + "Z":
            return period
    return None


def apollo11_numbers() -> dict:
    view = sky_view_at(Site(0.67408, 23.47297), et_of(APOLLO11["landing_utc"]))
    return {
        "sun_az_deg": round(view.sun.az_deg, 2),
        "sun_el_deg": round(view.sun.el_deg, 2),
        "earth_az_deg": round(view.earth.az_deg, 2),
        "earth_el_deg": round(view.earth.el_deg, 2),
    }


def build() -> dict:
    missions = []
    for m in MISSIONS:
        start, stop = m["window"]
        computed = {
            site_id: analyse(site_id, start, stop, m["landing_utc"]) for site_id in m["site_ids"]
        }
        entry = {k: v for k, v in m.items() if k != "window"}
        entry["window"] = {"start": iso(parse(start)), "end": iso(parse(stop))}
        for key in ("landing_utc", "ops_end_utc", "expected_sunrise_utc"):
            if key in entry:
                entry[key] = iso(parse(entry[key]))
        if "eclipse_window_utc" in entry:
            entry["eclipse_window_utc"] = [iso(parse(t)) for t in entry["eclipse_window_utc"]]
        entry["python"] = computed
        entry["sites"] = {site_id: site_info(site_id) for site_id in m["site_ids"]}
        missions.append(entry)
    apollo = dict(APOLLO11)
    apollo["landing_utc"] = iso(parse(apollo["landing_utc"]))
    apollo["offline"] = apollo11_numbers()
    apollo["sites"] = {"apollo11": {"app_id": "apollo-11", "lat": 0.67408, "lon": 23.47297, "height_m": 0.0,
                                    "mask": "apollo11"}}
    missions.append(apollo)
    return {
        "generated_utc": f"{datetime.now(timezone.utc):%Y-%m-%dT%H:%M:%SZ}",
        "generator": "pipeline/replays.py",
        "label": "plausibility",
        "note": NOTE,
        "missions": missions,
    }


def main() -> None:
    load_kernels()
    data = build()
    OUT_FILE.write_text(json.dumps(data, indent=2) + "\n")
    print("Wrote", OUT_FILE.relative_to(REPO_ROOT).as_posix())
    for m in data["missions"]:
        print(f"  {m['id']}: {', '.join(m['site_ids'])}")


if __name__ == "__main__":
    main()
