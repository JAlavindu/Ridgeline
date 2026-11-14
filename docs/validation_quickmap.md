# Quickmap cross-check of site heights (M3)

Tool: NASA/ASU LROC QuickMap (https://quickmap.lroc.asu.edu/), Object Inspector > Inspect tab,
point feature at the site coordinates, box size 0.03 km, 1x1 pixel, field "TerrainHeight".
Date checked: 2026-11-13/14.

| Site | Coordinates (lat, lon E) | Ridgeline height (m) | Quickmap TerrainHeight (m) | Quickmap - Ridgeline (m) |
|---|---|---|---|---|
| Connecting Ridge | -89.4395, 222.8066 | 1958.6 | 1959.57 | +0.97 |
| Malapert massif | -85.964, 357.681 | 4991.7 | 4991.59 | -0.11 |
| IM-2 | -84.7906, 29.1957 | 5321.9 | 5321.76 | -0.14 |

Result: all three agree within 1 m (tolerance: 50 m).
Scope: confirms our terrain reading and reprojection. It does not validate the site coordinates or the horizon masks.
Screenshots: docs/validation/quickmap/
