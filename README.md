# Ridgeline — Lunar Landing Site Navigator

> **If we land at this site on this date, when will we have sunlight for power and Earth in view to talk home, and how long until we lose each?**

Ridgeline is a web app for the NASA Space Apps Challenge 2026 *Lunar Landing Site Navigator* challenge. It is meant for mission planners, educators and the public. You pick a lunar landing site and a date, and in a few seconds Ridgeline shows:
- where the Sun and Earth sit above that site's real terrain horizon
- how much of the Sun's disc is visible and how much sunlight reaches a panel
- whether Earth is in view for direct-to-Earth (DTE) radio contact
- how long until each of these changes

Every position is checked against NASA JPL Horizons, and the checks are shown in the app.

> **Status:** in development (build week Nov 9–13, 2026). Features marked *planned* are not built yet, and validation results will appear here once they are measured.

---

## Why this is hard

- **The Sun stays low near the pole.** At the south pole it never rises more than about 1.5° above a flat horizon. A ridge tens of kilometres away can block it for days.
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
2. **Horizons.** For each site we cast 720 rays, one every 0.5° of azimuth, along true great circles over nested LOLA terrain maps:
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

We publish every test with its tolerance, its result and the reason for any gap, and we never tune settings toward a reference without saying so. Results are filled in as they are measured and also appear in the app's validation panel.

| ID | Test | Pass rule | Strength | Result |
|---|---|---|---|---|
| V1 | Our Sun and Earth az/el vs JPL Horizons, 6 sites, ~500 times each | ≤ 0.002° target; > 0.01° fails | Strong | *pending* |
| V2 | Browser engine vs Python/SPICE, 1,000 random cases | ≤ 0.001° | Strong | *pending* |
| V3 | Deliberate trap: feed UTC as TDB | **Must fail** by ~0.0098° (proves V1 is sensitive) | Strong | *pending* |
| V4 | Exact pole, smooth Moon, 2023–2032 | Max Sun height 1.54° ± 0.02° | Strong | *pending* |
| V5 | Equator, smooth Moon | Sun up ~50%; day ~14.8 d; Earth always up | Strong | *pending* |
| V6 | Chang'e-4 (far side) | Earth never visible | Strong | *pending* |
| V7 | 14 March 2025 total eclipse seen from the Moon | Sun fully covered 06:26–07:31 UT | Strong | *pending* |
| V8 | Apollo 11 landing geometry | Sun ~10.8° high, within 1° | Medium | *pending* |
| V9 | Our sunlight averages vs NASA PGDA 69 | Median gap ≤ 5 points | Medium | *pending* |
| V10 | Connecting Ridge at 2 m vs published ~88% sunlight | Within 3–5 points | Medium | *pending* |
| V11–V13 | Mission replays: IM-1, Chandrayaan-3, IM-2 | Plausibility only | Weak | *pending* |
| V14 | Horizon convergence (half step, double range, 0.25° azimuth) | < 0.01° RMS | Internal | *pending* |

## Limits — what we do and don't claim

- **We will claim:** "Sun and Earth positions match JPL Horizons within *X*°" and "sunlight averages agree with NASA PGDA 69 within *Y* points", with *X* and *Y* taken from the measured results.
- **We do not claim:** mission-grade predictions, exact power in watts for a real lander, temperatures, or single sunset times near the pole.
- **Terrain is the main source of error, not the ephemeris.** That is why polar countdowns are shown as windows.
- **Mission replays are stories, not proof.** Landers stop for many reasons; for example, IM-1 tipped over. We show the lander's end of operations next to the computed sunset and never label one as the other.
- **Sun model:** the Sun is treated as a uniformly bright disc (no limb darkening), as in NASA's illumination maps. Light refracted through Earth's atmosphere during an eclipse is ignored.
- **Earth visibility is geometry only.** Real contact also needs a ground antenna; that is checked only in the optional DSN mode.
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

> These commands describe the intended setup and will be confirmed as the code lands.

**Science pipeline** (Python 3.11+):
```bash
python -m venv pipeline/.venv
pipeline/.venv/Scripts/activate          # Windows; use `source pipeline/.venv/bin/activate` on macOS/Linux
pip install -r pipeline/requirements.txt # spiceypy==8.3.0, numpy, requests, pytest, rasterio, pyproj
python pipeline/get_kernels.py           # download the NAIF kernels
python pipeline/check_kernels.py         # sanity checks → docs/kernel_checks.txt
python pipeline/ephemeris.py             # → web/public/data/ephem.bin + ephem_meta.json
pytest pipeline/tests
```

**Web app** (Node 20+):
```bash
cd web
npm install
npm run dev        # local dev server
npx vitest run     # engine tests (browser maths = Python maths)
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
