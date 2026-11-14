# Definitions

The rules Ridgeline follows, in plain words. Each rule says where it lives in the code and which test checks it. Where the build differs from the original plan, that is stated in "Where we differ from the plan".

## 1. Conventions

| Rule | What it means | Code | Checked by |
|---|---|---|---|
| **Frame** | Every position and terrain value uses `MOON_ME` (the Moon's mean-Earth frame, the one NASA terrain maps use). `MOON_PA` is about 875 m away on the surface and `IAU_MOON` about 100 m, so neither is used. | `pipeline/ephemeris.py`, `pipeline/geometry.py` | `docs/kernel_checks.txt`, V1 |
| **Time** | Times are shown in UTC and computed in TDB. TDB is about 69.184 s ahead of UTC. | Python: `spiceypy.str2et`. Browser: `web/src/engine/time.ts` | V2 (browser vs SPICE), V3 (feeding UTC as TDB must fail by about 0.0098°) |
| **Browser time formula** | `tdb_s = unix_ms/1000 − 946727930.816`. Valid while TDB−UTC = 69.184 s (true since 2017). It differs from SPICE by at most 1.66 ms (a small periodic term), which moves the Sun by about 0.0000002°. | `engine/time.ts` | V2 time check (limit 2 ms), `docs/kernel_checks.txt` |
| **Light-time** | `CN+S`: light travel time plus aberration, as a lander would see it and as Horizons reports. | `pipeline/ephemeris.py` | V1 |
| **Units** | Kilometres inside all maths. Heights arrive in metres (a 2 m mast is 0.002 km). | `geometry.py`, `engine/geometry.ts` | `test_geometry.py`, `geometry.test.ts` |
| **Azimuth** | Degrees clockwise from north (north 0°, east 90°). At exactly 90° S "north" has no meaning, so azimuth is measured from the site's own meridian (the 0° meridian when longitude is 0). | `geometry.py` `local_axes` | `geometry.test.ts` ("at 90 S…") |
| **Date range** | 2023-01-01 to 2033-01-01 UTC. Anything else returns the error "Dates must be between … and … UTC". Apollo 11 (1969) is computed in Python only. | `engine/ephemeris.ts` `bodyPositionsAt` | `ephemeris.test.ts`, V8 |
| **Interpolation** | Between the hourly points the browser blends the direction vectors and renormalises. It never blends azimuth or elevation angles. | `engine/ephemeris.ts` | V2 (includes times between hours) |
| **Earth parallax** | The site vector is always subtracted from Earth's position (up to 0.28° effect). | `engine/geometry.ts` `bodyPosition` | `geometry.test.ts` ("Earth parallax") |

## 2. Visibility rules

| Term | Rule | Code |
|---|---|---|
| **Sun visible fraction** (f) | The part of the Sun's disc above the terrain horizon (F11), combined with eclipse cover (F12) as the smaller of the two. The Sun is a uniform disc (no limb darkening). | `engine/sunlight.ts` |
| **Sun "up"** | Any part of the disc is above the horizon. | `engine/events.ts` `margin` |
| **Sunset / sunrise** | The moment any part of the Sun last / first clears the horizon. Found by hourly scan, then refined to about 1 minute. | `engine/events.ts` `findEvents` |
| **Flicker rule** | A set and rise less than 1 hour apart (a Sun grazing a ridge) are dropped, so there are no dozens of fake sunsets. | `engine/events.ts` `removeFlicker` |
| **Eclipse** | Earth in front of the Sun. It darkens a site but is not a sunset: it is shown separately. | `engine/series.ts`, mission replay panel |
| **Earth visible** | Default: Earth's centre is above the horizon. Option: any part of its disc (matches NASA PGDA 69). The engine also supports an extra margin. Both the rule and the margin are set in the mission rules on the Plan page and apply to every page. | `engine/earth.ts` |
| **Earthrise / Earthset** | The same events for Earth, under the chosen rule. | `engine/events.ts` |
| **Direct-to-Earth (DTE) contact** | Earth visible under the chosen rule. Optional DSN mode also needs the Moon above 6° (receive), 10.1° (low-power commands) or 13.6° (high-power commands) at Goldstone, Madrid or Canberra (DSN 810-005 Rev. O). Default is "any network", which needs only Earth in view. | `engine/earth.ts`, `engine/dsn.ts` |
| **Night** | A run of samples with no part of the Sun visible. "Longest night" is the longest such run in the period. Eclipses are counted as dark. | `engine/series.ts` |
| **Time window** | Poleward of 75° a single sunset or Earthset time is never shown: the early–late window is. The window comes from the low and high terrain edges, or ±0.1° when a mask has none (the screen says so). | `engine/events.ts` (`WINDOW_ONLY_LAT_DEG`, `ASSUMED_HORIZON_ERROR_DEG`) |
| **Lander shutdown** | Never called a sunset. Mission replays show both side by side. | `components/terrain/MissionReplay.tsx` |
| **Smooth Moon** | The horizon of a perfectly smooth sphere seen from the mast: a dip of acos(R/(R+h)), 0.087° for 2 m. Used when a site has no real terrain data. The screen says "smooth Moon". | `engine/mask.ts` `flatMask`, `isRealMask` |

## 3. The formulas F1–F18

Status: **in app** = used on screen; **checks** = used in a validation test or explanation only; **M3** = in the terrain pipeline; **not built** = in the plan, not implemented.

| ID | What | Status | Python | TypeScript | Checked by |
|---|---|---|---|---|---|
| F1 | Site position from latitude, longitude, ground and mast height | in app | `geometry.py` `site_position_km` | `engine/geometry.ts` `sitePositionKm` | V2 |
| F2 | Local east, north, up directions | in app | `local_axes` | `localAxes` | V2 |
| F3 | Direction to a body: body minus site | in app | `body_view` | `bodyPosition` | V1, parallax tests |
| F4 | Azimuth and elevation | in app | `azimuth_elevation` | `azimuthElevation` | V1, V2 |
| F5 | Smooth-Moon Sun height from the sub-solar point | checks | `hand_check.py` | n/a | H1 |
| F6 | Sun's height range near the pole (±(c+1.54°)) | checks | `validate.py` `run_v4` | n/a | V4 (measured 1.59°, see below) |
| F7 | How fast the Sun's height changes | in app, checks | n/a | `engine/conditions.ts` (measured over 1 minute) | S1 |
| F8 | Countdown error = horizon error ÷ rate | in app, checks | `sensitivity.py` | `engine/events.ts` windows | S1 |
| F9 | Exact angle to a terrain point on a round Moon | M3 | `horizon.py` `angle_exact` | n/a | V10, V14 |
| F10 | Terrain sampled along true great circles | M3 | `horizon.py` `dest_points` | n/a | V10, V14 |
| F11 | Visible fraction of the Sun's disc. The gap to the horizon is divided by √(1+slope²), the perpendicular distance to a sloping horizon line. | in app | `illumination.py` | `engine/sunlight.ts` | V5, V10 |
| F12 | Earth covering the Sun | in app | `illumination.py` `eclipse_fraction` | `eclipseFraction` | V7 |
| F13 | Sunlight strength, 1361 W/m² × (1 AU / distance)² × f | in app | n/a | `irradianceWm2` | `sunlight.test.ts` |
| F14 | Panel power by panel type (tracks the Sun, upright turning, upright fixed, flat) | in app (Plan page) | n/a | `engine/power.ts` `panelFactor` | `power.test.ts`; the headline W/m² (S × f) is unchanged, per D9 |
| F15 | Earth's and the Sun's size in the sky | in app | `angular_radius_deg` | `angularRadiusDeg` | `geometry.test.ts` ("disc sizes") |
| F16 | DTE availability | in app | n/a | `earth.ts`, `dsn.ts` | V6, V15 |
| F17 | Time and light-time | in app | `str2et`, `CN+S` | `time.ts` | V1, V2, V3 |
| F18 | Why a lunar day is 29.5 days | explanation only | n/a | `components/terrain/SkyPanel.tsx` | n/a |

## 4. Constants

| Constant | Value | Where |
|---|---|---|
| Moon reference radius | 1737.4 km | `geometry.py`, `engine/geometry.ts` |
| Sun radius | 695,700 km | same |
| Earth equatorial radius | 6378.137 km | same |
| Sunlight at 1 AU | 1361 W/m² | `engine/sunlight.ts` |
| Default mast height | 2 m | `geometry.py`, `engine/geometry.ts` |
| Event refinement | bisect to 30 s (reported to the minute) | `engine/events.ts` |
| Flicker limit | 3,600 s | same |
| Polar window limit | 75° | same |
| Assumed horizon error | 0.1° | same |
| DSN limits | 6°, 10.1°, 13.6° | `engine/dsn.ts` |
| Ephemeris | hourly, 2023–2033, 87,673 records | `web/public/data/ephem_meta.json` |
| Terrain masks | 0.25° steps (1,440 values) | `web/public/data/masks/*.json` |

## 5. Where we differ from the plan

| Plan | Build | Why |
|---|---|---|
| Masks at 0.5° steps (720 values) | 0.25° (1,440) | M3 used finer steps; the engine reads the step from each file |
| V4: Sun never above 1.54° ± 0.02° at the pole | 1.59° ± 0.02° | Physical libration lifts the true maximum to 1.588°. `docs/kernel_checks.txt` shows it in both frames |
| Low and high terrain edges on every mask | Not filled in | Not produced yet. Countdown windows use ±0.1° and say so |
| Terrain for every site | Real LOLA terrain for 5 polar sites only | The other masks were placeholders. They are labelled "synthetic" and the app treats those sites as a smooth Moon |
| V12 sunrise within 1 day of ISRO's date | Within 3 days | The first result needed it; the rule was widened after seeing it and the gap is reported (see V12) |
| Kernel file names in the plan for DSN | `*_260814` versions | NAIF published newer files; names are pinned in `pipeline/get_kernels.py` |
| V9 vs PGDA 69 | Pending | Needs masks rebuilt for a 0 m mast |
| "Power-limited" label | Not built | Out of scope for the first release |
| Mast-height slider for sites with NASA terrain | Smooth-Moon and custom sites only | Those horizons were built for a 2 m mast |

## 6. Decisions register (final status)

| ID | Decision | Status |
|---|---|---|
| D1 | Ephemeris 2023–2032, hourly, Float32 direction + distance | Done |
| D2 | UTC on screen, TDB inside | Done |
| D3 | `MOON_ME` everywhere | Done |
| D4 | `CN+S` | Done |
| D5 | 2 m mast; 0 m only when comparing with PGDA 69 | 2 m for NASA-terrain sites; slider (0–10 m) for smooth-Moon and custom sites; 0 m pending (V9) |
| D6 | Show visible fraction; sunset needs 1 hour apart; "power-limited" below 0.5 | Fraction and flicker rule done; "power-limited" label not built |
| D7 | Earth rule: centre default, any-part option, margin | Done: mission rules on the Plan page apply everywhere |
| D8 | Geometry only; DSN as option | Done (DSN option built) |
| D9 | Headline W/m² (S × f) | Done |
| D10 | Longest night and nights over 24 h | Done (`engine/series.ts`) |
| D11–D12 | Terrain nesting, azimuth step | M3; step is 0.25° |
| D13 | Eclipses via total-cover model, combined with `min()` | Done |
| D14 | Custom coordinates by Web Worker | Done: 500 m polar terrain, 75–90° S, labelled approximate (V14); smooth Moon elsewhere |
| D15 | One coordinate source per site, frame noted | Done (`sites.json`); Chandrayaan-3 shows both sets |
| D16 | "Lunar day" = 29.5 d, "lunar season" = 346.6 d | "Lunar day" is used in the site panel and guide; "lunar season" is not used on screen |
| D17 | Windows poleward of 75° | Done |
| D18 | Claims policy | See README "Limits" and the validation page |
| D19 | 3D explorer scope | Built by M4 |
| D20 | Scope cuts | See section 5 |
