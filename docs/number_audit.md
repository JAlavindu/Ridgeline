# Number audit (M1, Sunday review)

Every number a visitor can see, where it comes from, and what checks it. Formula IDs (F1–F18) are from the plan's formula sheet; `DEFINITIONS.md` explains each. Status: **OK** = traced and tested, **Fixed** = was untraceable and has been changed, **Open** = known gap, not on a demo path.

All times on screen are UTC and say so.

## Home page

| Label | Value | Source | Where | Status |
|---|---|---|---|---|
| Diameter | 3,474 km | NASA NSSDC Moon Fact Sheet (mean 3,474.8 km) | `components/home/MoonHero.tsx` | OK, source now printed under the value |
| Gravity | 1.62 m/s² | NSSDC | same | OK, source printed |
| Density | 3,344 kg/m³ | NSSDC | same | OK, source printed |
| Equator tilt to orbit | 6.68° | NSSDC, plan §7.1 | same | **Fixed**: label was "Inclination", which means something else |
| Earth–Moon distance | 384 000 km | mean distance, NSSDC; plan §7.1 | same | OK (mean, not live) |

## Explore Moon page (`/terrain`)

| Label | Source | Status |
|---|---|---|
| Site list, coordinates, year, country | `data/lunarSites.ts` and `public/data/sites.json` (one coordinate source per site, frame noted) | OK, sources in `sites.json` `coord_source` |
| Mission history counts ("N landings in YEAR") | counted from the same site list | OK |
| Selected site coordinates | formatted from the site list | OK |

## Site panel

| Tab / label | Source | Formula | Checked by | Status |
|---|---|---|---|---|
| Overview: Sunlight, disc % | engine `skyState` | F11, F12 | V2, V5, V7, `sunlight.test.ts` | OK |
| Overview: Earth contact, height | engine | F3, F4, F16 | V1, V6, `earth.test.ts` | OK |
| Overview: countdowns | engine `outlook` | F8 (windows poleward of 75°) | `events.test.ts`, S1 | OK |
| Location: latitude, longitude | `sites.json` | F1 | V1 (same coordinates) | OK |
| Location: elevation | real LOLA mask `site_height_m`, else `sites.json` `height_m`, else "Not available" | F1 | V10 | **Fixed**: placeholder masks had a made-up −1,500 m |
| Mission replay (IM-1, IM-2, Chandrayaan-3, Apollo 11) | engine live; facts from `replays.json` with sources | F11–F13 | V11–V13, `replay.test.ts` | OK. Facts are marked "not yet checked against a primary source" |
| Sun & Earth: all values and 14-day summary | engine | F3, F4, F11–F13, F16 | V1, V2, `series.test.ts` | OK |
| Sun & Earth: DSN contact | `dsn.bin` + engine Earth visibility | F16 | V15, `dsn.test.ts` | OK |
| Terrain: grid 60 m, 30 × 30 km | tile metadata (`step_m`, `half_m`) | F10 | M3's tile build | OK |
| Terrain: heights min/max | tile data | n/a | n/a | **Fixed**: number format ("+-706m") |
| Terrain: "Horizon: LOLA terrain / Smooth Moon" | `isRealMask` | n/a | `mask.test.ts` | **Fixed**: was always "LOLA" |
| Horizon: skyline, Sun, Earth, ridge heights | real mask or smooth Moon, engine sky | F9–F11 | V10, V14 | **Fixed**: was a mock sine model; placeholder masks are now a smooth Moon |
| Horizon: angle step, observer height | mask file fields | n/a | n/a | **Fixed**: was typed as 0.25° / 2.0 m |
| Science: flux, disc %, separation, rate, Earth distance | engine | F7, F11–F13, F15 | V2 | **Fixed**: was a mock model |
| Science: temperatures (−180 °C, +120 °C) | text | general Moon fact | none | Open: no source printed; commonly quoted values |
| Time-lapse "Time shown" | real clock + hour offset, UTC | F17 | V2, V3 | **Fixed**: was an invented time |

## Guide panel ("The lunar sky")

| Claim | Source | Status |
|---|---|---|
| Lunar day 29.5 days | plan §7.1, F18 | OK |
| Earth drifts "a few degrees" (libration up to about 8°) | plan §7.1 | OK |
| Sketch of low Sun and Earth | labelled "not to scale" | OK |

## Plan page (`/plan`)

| Label | Source | Formula | Checked by | Status |
|---|---|---|---|---|
| Sun up, average sunlight, Earth in view, power and contact | engine `sampleSeries` + `summarize` (10-minute samples) | F11, F12, F16 | V2, V5, S3, `series.test.ts` | OK |
| Sunlight on the panel (W/m²) and electric (W/m²) | S × f × panel factor; × efficiency (labelled "example") | F13, F14 | `power.test.ts` | OK |
| Longest night, longest comms gap, eclipse hours | engine `summarize` | D10 | `series.test.ts` | OK |
| Next sunset / Earthset | engine `outlook`, a window poleward of 75° | F8 | `events.test.ts`, S1 | OK |
| Horizon line ("LOLA terrain", "approximate (500 m terrain)", "smooth Moon") | mask source | F9, F10 | V14, `customHorizon.test.ts` | OK |
| Slip chart: sunlight %, longest night per start date | engine `slipScan` (hourly samples) | as above | `series.test.ts` | OK |
| Window finder: start dates that meet the rule | engine `slipScan`, 365 daily starts | as above | browser check | OK |
| Timeline values (UTC) | engine `timelineRows` | as above | `series.test.ts` | OK |
| Custom point latitude/longitude from the map | south polar stereographic inverse | n/a | `polarMap.test.ts` (matches M3's check pixel) | OK |

## Validation page (`/validation`)

All values are read from `validation.json` at load time; nothing is typed on the page. Statuses come from `lib/validation.ts` (tested).

## Not on screen

| Item | Note |
|---|---|
| `charts/ScenarioBoard.tsx` | Still uses the mock model. It is **not mounted** anywhere, so no visitor sees it. If it is mounted later it must switch to the engine first. |
| `pages/NavigatePage.tsx` and `components/navigate/*` | Not imported by any route, so no visitor reaches them. They contain earlier mock-based screens. Delete them or switch them to the engine before anyone links to them. |
| Panorama and 3D explorer helper text | Descriptive only; the sun/earth numbers are formatted and come from the engine. |

## Checks still needed from a person

- Units and a "UTC" label on every chart axis in the panorama (labels read N/NE/E; times shown in text carry "UTC").
- The planned Sun height of 10.8° and Earth about 60° for Apollo 11 come from the plan, not a primary NASA page.
