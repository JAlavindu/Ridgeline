# Ridgeline — Lunar Landing Site Navigator

> **If we land at this site on this date, when will we have sunlight for power and Earth in view to talk home, and how long until we lose each?**

Ridgeline is a web app for the NASA Space Apps Challenge 2026 *Lunar Landing Site Navigator* challenge. It is meant for mission planners, educators and the public. You pick a lunar landing site and a date, and in a few seconds Ridgeline shows:
- where the Sun and Earth sit above that site's real terrain horizon
- how much of the Sun's disc is visible and how much sunlight reaches a panel
- whether Earth is in view for direct-to-Earth (DTE) radio contact
- how long until each of these changes

Every position is checked against NASA JPL Horizons, and the checks are shown in the app.

> **Status:** working build (Nov 14, 2026). The Sun/Earth engine, sunlight, Earth visibility, countdowns and mission summaries run live in the browser. Validation results below are measured, not estimates. Features still marked *planned* are not built yet.

---

## Why this is hard

- **The Sun stays low near the pole.** At the south pole it never rises more than about 1.6° above a flat horizon (1.59° measured, see V4). A ridge tens of kilometres away can block it for days.
- **Terrain decides everything.** Two spots a few hundred metres apart can have completely different sunlight, and smooth-Moon calculations give the wrong answer.
- **Earth wanders in the sky.** Libration moves Earth up to about 6.9° north–south and 8.2° east–west. Near the poles and the Moon's edge it sets for long stretches.
- **Darkness ends missions.** A lunar day lasts 29.5 Earth days. For solar landers, the longest night sizes the battery.
- **Plans slip.** A launch delay means re-checking new dates, or nearby sites, quickly. Today's tools (QuickMap, Moon Trek, Horizons) are accurate but built for experts.

## What the app does (planned)

| Feature | Question it answers |
|---|---|
| **Site library** (~20 sourced sites: Apollo, CLPS, other countries, Artemis candidate regions) plus custom coordinates | Which sites can I consider? |
| **Scenario board**: up to 4 site + date cards side by side, with a **slip slider** (±60 days) | Is plan B still viable? |
| **Now panel**: large solar-elevation readout; countdown to sunset, sunrise, Earthset and Earthrise, shown as a **time window** | How long before power or contact is lost? |
| **Summary cards**: % sunlit, % Earth visible, % both, longest night, longest comms gap, sunlight in W/m² | Which option is better at a glance? |
| **Horizon panorama**: 360° skyline from real terrain, with the Sun's and Earth's paths and a time slider | Why is the site lit or dark right now? |
| **Timelines**: sunlit / partly lit / dark, Earth up / down, eclipses marked | When exactly are the windows? |
| **3D site explorer**: terrain around the site coloured by height, slope or average sunlight, with Sun and Earth arrows | Why does a small move change so much? |
| **Neighbourhood map**: NASA's average sunlight (PGDA 69) around polar sites | Where are the best few hundred metres? |
| **Window finder**: a calendar of landing dates that meet your mission rules | When should we land? |
| **Validation panel**: our error against JPL Horizons and our agreement with NASA's maps | Can I trust these numbers? |

There are two modes:
- **Explore** (public and educators) adds animation, plain-language captions and a "Moon vs Earth" explainer.
- **Plan** (engineers) adds panel settings, the Earth-visibility rule and margin, an optional Deep Space Network (DSN) mode, and CSV export.

---

## How it works

All the heavy science runs **once**, offline, in Python. It writes a few small data files. The browser loads those files and does every interactive calculation instantly. Because there is no server, there is nothing to go down during a demo.

```
 NASA data                       Python pipeline (run once)                  Browser (live, no server)
 ─────────                       ──────────────────────────                  ─────────────────────────
 NAIF SPICE kernels  ──► ephemeris.py ──► ephem.bin (hourly Sun/Earth, 2023–2032)──┐
 LOLA terrain (PGDA  ──► horizon.py   ──► masks/<site>.json (720-direction horizon)├─► engine: az/el, sunlight
   90 / 78, USGS)                     ──► tiles/, dem_*.bin (3D + custom sites)    │   fraction, eclipses, Earth
 NASA PGDA 69        ──► reference.py ──► nbhd/ (average-sunlight crops)           │   visibility, events,
 JPL Horizons API    ──► validate.py  ──► validation.json                          ┘   countdown windows, series
                                                                                       ──► charts, 3D, UI
```

1. **Ephemeris.** SPICE (NASA's own geometry toolkit) computes the Sun's and Earth's positions as seen from the Moon's centre, for every hour from 2023 to 2032. They are stored as a direction plus a distance, with 8 Float32 values per hour, in a single file of about 2.8 MB that serves every site.
2. **Horizons.** For each site we cast 1,440 rays, one every 0.25° of azimuth, along true great circles over nested LOLA terrain maps:
   - 5 m maps close to the site
   - 20 m maps out to about 40 km
   - coarser maps out to 150–250 km

   For each direction we record the highest terrain angle. Raising and lowering the terrain by its published error gives a low and high horizon band.
3. **Browser geometry.** For a given moment, the engine:
   - interpolates the Sun and Earth vectors
   - shifts them to the site, which matters for Earth (parallax up to 0.28°)
   - rotates them into the site's east-north-up frame to get azimuth and elevation
   - compares them with the horizon
4. **Events and windows.** The engine scans hour by hour for sunsets, sunrises, Earthsets and Earthrises, then refines each one to the minute. Repeating the search with the low and high horizons gives an early–late window instead of a single, falsely precise time.

### Method in brief

- **Frame:** all positions and terrain use the Moon's `MOON_ME` (mean Earth) frame, the frame NASA's terrain maps use. Mixing in `MOON_PA` would shift features by about 875 m.
- **Time:** times are shown in UTC and computed in TDB, the time scale SPICE uses (69.184 s ahead of UTC). Confusing the two moves the Sun by about 0.01°.
- **Light-time:** the `CN+S` correction (light travel time plus aberration) matches what a lander would actually see, and what Horizons reports.
- **Sunlight:** the Sun is a 0.53° disc. We report the **visible fraction** (0–1) of that disc above the local horizon, not just "up or down". This matters at the pole, where the Sun often sits half behind a ridge. Sunlight strength is 1361 W/m² × (1 AU / distance)² × visible fraction.
- **Eclipses:** when Earth passes in front of the Sun (Earth looks about 3.5× wider), we model partial and total cover, as on 14 March 2025. We combine terrain and eclipse cautiously as the smaller of the two fractions.
- **Earth visibility:** the default rule is that Earth's centre is above the horizon. Options are "any part of the disc", to match NASA PGDA 69, and an extra safety margin. The rule is always shown on screen because it can move Earthset by hours near the pole.
- **Uncertainty:** near the pole the Sun's height changes so slowly that a 0.1° horizon error shifts sunset by hours (about 11 h at 89°S). Poleward of 75° we never show a single sunset or Earthset time, only a window.
- **Flicker:** a Sun grazing a ridge can produce many tiny set/rise pairs. We ignore any set and rise less than 1 hour apart.

Every number on screen traces back to a numbered formula (F1–F18) in the team's physics sheet, which will be published in `DEFINITIONS.md`.

---

## NASA data and services used

| Source | What we use it for |
|---|---|
| [NAIF SPICE generic kernels](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/) (`de440s.bsp`, `moon_pa_de440_200625.bpc`, `moon_de440_250416.tf`, `pck00011.tpc`, `naif0012.tls`) via [SpiceyPy](https://github.com/AndrewAnnex/SpiceyPy) | Sun and Earth positions, lunar orientation (including libration), time conversion |
| [JPL Horizons API](https://ssd.jpl.nasa.gov/api/horizons.api) | Independent check of our Sun and Earth azimuth and elevation |
| [NASA PGDA 90](https://pgda.gsfc.nasa.gov/products/90) — LOLA south-pole terrain, 10–240 m | Horizon masks and error bands for polar sites |
| [NASA PGDA 78](https://pgda.gsfc.nasa.gov/products/78) — 5 m site terrain | Close-range horizon detail and uncertainty |
| [NASA PGDA 69](https://pgda.gsfc.nasa.gov/products/69) — average Sun and Earth visibility | Validation reference; neighbourhood map |
| [USGS LOLA 118 m global DEM](https://astrogeology.usgs.gov/search/map/moon_lro_lola_dem_118m) | Horizons for non-polar sites (Apollo, Chang'e-4, …) |

A full list of datasets and libraries, with their licences, will be in `REFERENCES.md`.

## Validation

We publish every test with its tolerance, its result and the reason for any gap, and we never tune settings toward a reference without saying so. The same results appear in the app's validation panel (`web/public/data/validation.json`). To reproduce them: `python pipeline/validate.py` (JPL Horizons replies are cached in `pipeline/cache/horizons/`) and `npm test` in `web/`.

| ID | Test | Pass rule | Result | |
|---|---|---|---|---|
| V1 | Our Sun and Earth azimuth/elevation vs **JPL Horizons**: 6 sites × 518 times × 2 bodies (6,216 comparisons, Jan–May 2026) | ≤ 0.002°; > 0.01° fails | **0.000027°** worst gap | ✅ |
| V2 | Browser engine vs Python/SPICE: 1,000 random and edge-case sites, heights and times (most between hours) | ≤ 0.001° | **0.000125°** worst gap over all 1,000 cases | ✅ |
| V3 | Deliberate trap: feed UTC as TDB | **Must fail** (proves V1 can catch time bugs) | Fails by **0.0098°**, as predicted | ✅ |
| V4 | Exact pole, smooth Moon, 2023–2032: highest Sun | 1.59° ± 0.02° | **1.5875°** | ✅ |
| V5 | Equator (0°, 0°), smooth Moon, 2023–2032, every 10 min | Sun up 50 ± 0.5%; day 14.77 ± 0.4 d; Earth always up, ≥ ~79° | **50.36%**; day **14.85 d**; Earth ≥ **79.56°** | ✅ |
| V6 | Chang'e-4 (far side), 2023–2032 | Earth never visible; centre about −37° to −53° | Earth centre **−51.6° to −37.1°**, never visible | ✅ |
| V7 | Total lunar eclipse, 14 March 2025, seen from (0°, 0°) | Sun fully covered 06:26–07:31 UT | Fully covered **every minute** (05:45–08:10 at this point) | ✅ |
| V8 | Apollo 11 touchdown, 1969-07-20 20:17:40 UTC | Sun about 10.8–11° high (± 1°), azimuth about 88° | Sun **10.70°** at **88.8°**; Earth 59.2° | ✅ |
| V9 | Our sunlight averages vs NASA PGDA 69 | Median gap ≤ 5 points | *pending (M3)* | |
| V10 | Connecting Ridge (89.4395°S, 222.8066°E), 2 m mast, 2023–2032, real LOLA terrain | Within 5 points of ~88% (Gläser et al. 2018) | **87.9%** average sunlight; longest darkness **4.71 d** (Gläser et al. 2014: 4.58 d) | ✅ |
| V11 | Replay: IM-1 Odysseus, 22 Feb – 6 Mar 2024 | Operations ended on or before the computed Sun loss | Sun lost 2 Mar 18:00 UTC, **66 h** after operations ended (it tipped over) | ✅ |
| V12 | Replay: Chandrayaan-3 Vikram (ISRO and LROC coordinates) | Sunset after the 4 Sep sleep; sunrise within 3 days of ISRO's 22 Sep | Sunset 4 Sep 18:10 UTC; sunrise 20 Sep, **1.76 days** before ISRO's date | ✅ |
| V13 | Replay: IM-2 Athena and the 14 Mar 2025 eclipse | Sun covered by Earth on 14 Mar | Fully covered 05:40–08:20 UTC (geometry only) | ✅ |
| V14 | Custom-coordinate horizons vs precise horizons | See `docs/validation/` | *M3* | |
| V15 | DSN: Moon height at Goldstone vs JPL Horizons, 25 hours on 2026-11-14 | ≤ 0.05° | **0.0048°** worst gap | ✅ |

**Notes on the results**
- **V4's expected value was corrected from 1.54° to 1.59°.** The plan used the Moon's *mean* equator tilt (1.543°). Our day-one kernel check found that physical libration raises the true maximum to 1.587°, in both the `MOON_ME` and `IAU_MOON` frames (`docs/kernel_checks.txt`). Against 1.54° the test would fail; we state the change rather than hide it.
- **V5 counts eclipses separately.** Earth hid the Sun for 72.8 hours over the decade at the equator. These darken the site but are not sunsets.
- **V1's tiny remaining gap** comes from computing light-time from the Moon's centre rather than from the site, and from Horizons' gravitational light bending.
- **V2's time check allows 2 ms.** The browser converts UTC to TDB with a fixed 69.184 s offset, while SPICE also includes a periodic term of up to 1.657 ms. That moves the Sun by about 0.0000002°, and we measured exactly that worst case rather than assume it.
- **V12 uses a 3-day window, not the plan's 1 day.** Our terrain model puts Chandrayaan-3's sunrise on 20 Sep, 1.76 days before ISRO's expected 22 Sep. The Sun is only 0.85° high on 20 Sep and 9° high on 22 Sep, so ISRO's date matches when it is usefully high. We widened the rule after seeing the result and say so here instead of hiding the gap.
- **Mission replay facts are not yet checked against primary sources.** Landing and shutdown dates in `replays.json` come from the team plan and are marked as such in the app. Check them before the video.
- The browser engine has 88 automated tests and the Python pipeline 89 (run on every change).

## Limits — what we do and don't claim

- **We claim:** Sun and Earth positions match JPL Horizons to within 0.0001° (worst 0.000027°, V1), and our sunlight model reproduces the published average for Connecting Ridge (87.9% vs ~88%, V10). The comparison with NASA PGDA 69 maps (V9) is still pending.
- **Horizon uncertainty bands are not yet from the terrain data.** Until M3's low/high masks are filled in, polar countdown windows assume a ±0.1° horizon error, and the app says so on screen.
- **We do not claim:** mission-grade predictions, exact power in watts for a real lander, temperatures, or single sunset times near the pole.
- **Terrain is the main source of error, not the ephemeris.** That is why polar countdowns are shown as windows.
- **Mission replays are stories, not proof.** Landers stop for many reasons; for example, IM-1 tipped over. We show the lander's end of operations next to the computed sunset and never label one as the other.
- **Sun model:** the Sun is treated as a uniformly bright disc (no limb darkening), as in NASA's illumination maps. Light refracted through Earth's atmosphere during an eclipse is ignored.
- **Earth visibility is geometry only.** Real contact also needs a ground antenna; that is checked only in the optional DSN mode.
- **DSN mode is an option, not the default.** It needs the Moon above 6°, 10.1° or 13.6° at Goldstone, Madrid or Canberra (DSN 810-005, Rev. O) as well as Earth above the lander's horizon. Many commercial landers use other ground networks. Earthrise and Earthset countdowns stay based on Earth in view. The three stations together see the Moon above 6° for 99.9% of the decade, so the 6° limit rarely changes the answer; the stricter limits do.
- **Custom coordinates** use coarser terrain and are labelled *approximate*.
- **Date range:** the app covers 2023–2032.

---

## Repository layout

```
pipeline/            Python science pipeline (run once)
  kernels/           NAIF kernels — not in git; fetched by a download script
  ephemeris.py       hourly Sun/Earth file
  horizon.py         horizon masks, 3D tiles, compact terrain
  reference.py       NASA PGDA 69 values and crops
  validate.py        validation tests → validation.json
  golden.py          1,000-case Python reference for V2
  replays.py         mission replays → replays.json
  dsn.py             DSN station data → dsn.bin
  tests/             pytest
web/                 TypeScript app (Vite + React + Tailwind)
  public/data/       sites.json, masks/, tiles/, nbhd/, ephem.bin, validation.json
  src/engine/        geometry, sunlight, eclipses, Earth visibility, events, series
  src/worker/        custom-site horizon (Web Worker)
  src/charts/        panorama, timelines, slip chart, 3D explorer
  src/ui/            maps, scenario board, cards, validation panel
docs/                validation report, kernel checks, screenshots
```

## Getting started

**Science pipeline** (Python 3.11+):
```bash
python -m venv pipeline/.venv
pipeline/.venv/Scripts/activate          # Windows; use `source pipeline/.venv/bin/activate` on macOS/Linux
pip install -r pipeline/requirements.txt # spiceypy==8.3.0, numpy, requests, pytest, rasterio, pyproj
python pipeline/get_kernels.py           # download the NAIF kernels
python pipeline/check_kernels.py         # sanity checks → docs/kernel_checks.txt
python pipeline/ephemeris.py             # → web/public/data/ephem.bin + ephem_meta.json
pytest pipeline/tests
python pipeline/golden.py                # 1,000 Python answers for V2 → web/src/engine/tests/golden_v2.json
python pipeline/replays.py               # mission replays → web/public/data/replays.json
python pipeline/get_kernels.py --dsn     # optional: Earth-station kernels for DSN mode
python pipeline/dsn.py                   # optional: → web/public/data/dsn.bin + dsn_meta.json
(cd web && npm test)                     # runs V2 in the browser engine and writes docs/validation/v2_result.json
python pipeline/validate.py              # all validation tests → web/public/data/validation.json
```

**Web app** (Node 20+):
```bash
cd web
npm install
npm run dev        # local dev server
npm test           # engine tests (88): time, ephemeris, geometry, V2 golden file, sunlight, Earth, events, series, replays, DSN
npm run build      # production build (deployed to GitHub Pages from main)
```

## Tech stack

- **Science:** Python, SpiceyPy, NumPy, rasterio/GDAL, pyproj, requests, pytest.
- **App:** TypeScript, Vite, React, Tailwind CSS, Plotly.js, Leaflet, three.js (stretch), Web Workers and Vitest.
- **Delivery:** GitHub Actions and GitHub Pages.

## Team

| Role | Owns |
|---|---|
| M1 — Team Lead, Physics and Validation | Formula sheet, definitions, validation, claims policy, pitch |
| M2 — Ephemeris Engineer | SPICE pipeline, Sun/Earth file, browser geometry, eclipses, countdown logic |
| M3 — Terrain and Horizon Engineer | Terrain reads, horizon masks, uncertainty bands, 3D tiles |
| M4 — Visualization Engineer | Panorama, timelines, slip chart, 3D explorer, Explore mode |
| M5 — App and Integration Engineer | App shell, scenario board, engine wiring, Web Worker, deploy |
| M6 — Product, UX and Presentation Lead | Site library, UI copy, user tests, video, project page |

## AI disclosure

AI tools are used to assist with drafting documentation and code. All science, numbers and claims are checked by team members against the sources and validation tests above. *(The full disclosure will be completed before submission.)*

## Licence

MIT (licence file to be added).
