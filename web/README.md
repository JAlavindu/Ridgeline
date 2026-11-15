# Ridgeline web app

The browser half of Ridgeline, our NASA Space Apps 2026 entry for the *Lunar Landing Site Navigator* challenge. For a lunar site and a date it shows when there is sunlight for power, when Earth is in view for direct contact, and how long until each is lost.

The app has no server. A Python pipeline (`../pipeline/`) uses NASA's SPICE toolkit to precompute small data files once. The browser then does every interactive calculation from those files. For the science, data sources, validation results and limits, see the [main README](../README.md). Every formula is explained in [`docs/Ridgeline_formula_guide.pdf`](../docs/Ridgeline_formula_guide.pdf).

**Live app:** https://ridgeline-lavindu-pereras-projects.vercel.app/

## Getting started

Needs Node 20 or newer (CI uses Node 22).

```bash
cd web
npm install
npm run dev        # local dev server with hot reload
npm test           # all tests once (Vitest)
npm run lint       # ESLint
npm run build      # type check (tsc -b), then production build into dist/
npm run preview    # serve the production build locally
```

To run a single test file or test: `npx vitest run src/engine/tests/events.test.ts -t "flicker"`.

The data files in `public/data/` are committed, so the app runs without the Python pipeline. Re-run the pipeline only when you change the science or the sites.

## Pages

| Route | Page | What it shows |
|---|---|---|
| `/` | `HomePage` | Landing page with the 3D Moon. |
| `/terrain` | `TerrainPage` | Explore Moon: site library, 3D Moon, site panel (overview, Sun and Earth, terrain, horizon, science, mission replays, optional DSN contact). |
| `/plan` | `PlanPage` | Compare up to 4 sites over one mission (1 to 365 days): launch-slip chart, mission timeline, window finder, custom coordinates, mission rules. |
| `/validation` | `ValidationPage` | Every validation test with its pass rule, result, explanation and equations, read from `validation.json`. |
| `/team` | `TeamPage` | The team. |

Any other path shows the home page. `vercel.json` sends every route to `index.html`, so direct links and page reloads work.

## How a number is calculated

For each question, the engine in `src/engine/` runs this chain. The formula IDs match the formula guide.

1. **Sun and Earth positions** (`ephemeris.ts`, `time.ts`): convert the chosen UTC time to TDB, read `ephem.bin`, and blend the two nearest hourly records. Direction arrows are blended and then renormalised; angles are never interpolated. (F17, E1)
2. **The site and its local directions** (`geometry.ts`): the site position, plus east, north and up arrows. (F1, F2)
3. **Which way to look** (`geometry.ts`): body position minus site position. This parallax correction is required for Earth, where it reaches 0.28°. (F3)
4. **Where in the sky** (`geometry.ts`, `vec3.ts`): azimuth, elevation, disc size, and the Sun–Earth angle. (F4, F15, E2)
5. **Is it blocked?** (`mask.ts`, `sunlight.ts`, `earth.ts`, `power.ts`, `dsn.ts`): compare with the terrain horizon to get the visible part of the Sun, eclipses, W/m², panel power and the Earth visibility margin. (E4, F11–F14, F16)
6. **When does it change?** (`events.ts`, `series.ts`): find rises and sets by an hourly scan plus bisection, build the uncertainty windows, then the summary numbers. (E5–E7, F8)

Conventions the code relies on:
- **Frame and light-time:** positions are in the `MOON_ME` frame, with `CN+S` light-time correction.
- **Units:** km inside all maths. Heights arrive in metres.
- **Time:** UTC on screen, TDB in the maths: `tdb_s = unix_ms / 1000 − 946727930.816`.
- **Date range:** dates outside 2023–2032 give a clear error.
- **Polar countdowns:** poleward of 75°, a countdown is shown as a window, never as one time.

## Folder layout

```
src/
  engine/       the science: time, ephemeris, geometry, sunlight, Earth, DSN, power, events, series, custom horizons
    tests/      Vitest tests, including the V2 golden-file test and the Python-made golden files
  worker/       horizonWorker.ts: builds custom-coordinate horizons off the main thread
  hooks/        useEngine, useScenario, useCustomHorizon: connect the engine to React
  lib/          plan and settings state, formatting, polar map maths, validation helpers and equations
  pages/        one component per route
  components/   home, terrain (Explore Moon), plan, 3d, Nav, Footer
  charts/       panorama, timelines, slip chart, 3D site explorer
  data/         lunarSites.ts: the site list
public/data/    files written by the Python pipeline (see below)
```

`pages/NavigatePage.tsx`, `components/navigate/` and `charts/ScenarioBoard.tsx` are earlier screens. They are not reachable from any route and still use mock data (`utils/mockData.ts`). Switch them to the engine before linking to them.

## Data files (`public/data/`)

These files are the contract between the Python pipeline and the app. Change their format on both sides together.

| File | Made by | Contents |
|---|---|---|
| `ephem.bin` + `ephem_meta.json` | `pipeline/ephemeris.py` | Sun and Earth, every hour from 2023-01-01 to 2033-01-01 TDB (87,673 records). Each record is 8 little-endian Float32 values: `sun_dir[3], sun_dist_km, earth_dir[3], earth_dist_km`. About 2.8 MB. |
| `sites.json` | team | Named sites with coordinates and sources. |
| `masks/<id>.json` | `pipeline/write_masks.py` | Horizon masks: 1,440 heights at 0.25° steps, from LOLA terrain. `masks_0m/` holds the same masks for a 0 m mast (`write_masks.py --h-obs 0`), used by validation test V9. |
| `tiles/` | `pipeline/write_tiles.py` | Terrain tiles for the 3D explorer. |
| `nbhd/` | `pipeline/reference.py` | NASA PGDA 69 average-visibility crops around each site. |
| `dem_polar_500m.bin` + `.json` | `pipeline/make_polar_dem.py` | 500 m south-polar terrain for custom-coordinate horizons. |
| `hillshade_polar.png` + `.json` | `pipeline/make_polar_dem.py` | Shaded relief image for the polar map on the Plan page. |
| `dsn.bin` + `dsn_meta.json` | `pipeline/dsn.py` | Moon elevation at Goldstone, Madrid and Canberra, for the optional DSN mode. |
| `replays.json` | `pipeline/replays.py` | Mission replay windows and sourced facts. |
| `validation.json` | `pipeline/validate.py` | All validation results shown on `/validation`. |

## Tests

`npm test` runs 130+ tests in 17 files. They cover:
- every formula, with simple cases whose answers are known;
- the **V2 golden-file test**: the browser engine must match 1,000 SPICE answers made by `pipeline/golden.py` within 0.001°. It writes `../docs/validation/v2_result.json`;
- the custom-horizon builder against its Python golden file;
- the plan board and launch-slip scan;
- the validation-page helpers, including a check that every test on the page has its equations.

When the science changes, regenerate the golden files with `python pipeline/golden.py` and `python pipeline/custom_golden.py`, then run `npm test` and `python pipeline/validate.py` from the repo root.

## Deployment

Vercel builds and deploys `main` automatically, so `main` must always build. GitHub Actions (`.github/workflows/ci.yml`) runs on every pull request and every push to `main`: `npm ci`, `tsc -b`, `vitest run` and `npm run build`. Lint runs too but does not block yet. Work on a short branch and open one pull request per change.

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS 4, React Router, three.js with React Three Fiber and drei (3D Moon and terrain), GSAP, Motion and Lenis (animation and scrolling), Web Workers, Vitest and ESLint.
