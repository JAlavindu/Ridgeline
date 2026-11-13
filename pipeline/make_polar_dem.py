"""make_polar_dem.py (M3): compact polar terrain for custom coordinates + hillshade image for the map.
Run from the Ridgeline folder:  python pipeline/make_polar_dem.py
Writes web/public/data/dem_polar_500m.bin (+ .json) and web/public/data/hillshade_polar.png
"""
import json, sys
from pathlib import Path
import numpy as np, pyproj
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from terrain import Dem, R, GEO

ROOT = Path(__file__).resolve().parent.parent
TER = ROOT / "pipeline" / "data" / "terrain"
OUT = ROOT / "web" / "public" / "data"
N, STEP = 1830, 500.0                      # 915 km square, centred on the pole (covers 75 S and beyond)
NODATA = -32768
src = sorted(TER.glob("LDEM_60S_240MPP_ADJ*.TIF")) + sorted(TER.glob("LDEM_60S_240MPP_ADJ*.tif"))
if not src:
    sys.exit("LDEM_60S_240MPP_ADJ*.TIF not found in pipeline/data/terrain")
dem = Dem(src[0])
inv = lambda x, y: dem.fwd.transform(x, y, direction="INVERSE")   # map metres -> lon/lat

i = np.arange(N)
xs = (i + 0.5 - N / 2) * STEP              # column centres, west -> east
ys = (N / 2 - 0.5 - i) * STEP              # row centres, row 0 = top = +y (the lon 0 direction)
X, Y = np.meshgrid(xs, ys)

# average 4 samples per 500 m pixel (offsets of +-125 m) so we do not alias the 240 m source
z = np.zeros(X.shape, dtype="float64"); cnt = np.zeros(X.shape)
for dx in (-125.0, 125.0):
    for dy in (-125.0, 125.0):
        lo, la = inv((X + dx).ravel(), (Y + dy).ravel())
        h = dem.sample(np.asarray(lo), np.asarray(la)).reshape(X.shape)
        ok = np.isfinite(h)
        z[ok] += h[ok]; cnt[ok] += 1
z = np.where(cnt > 0, z / np.maximum(cnt, 1), np.nan)
print("pixels with data: %.1f %%   height range %.0f .. %.0f m" % (100 * np.isfinite(z).mean(), np.nanmin(z), np.nanmax(z)))

q = np.where(np.isfinite(z), np.clip(np.round(z), -32767, 32767), NODATA).astype("<i2")
q.tofile(OUT / "dem_polar_500m.bin")

# self-test values for the JavaScript side: lat, lon -> row, col, height (read back from the file)
def to_xy(lat, lon):                       # spherical south polar stereographic, the formula M5 should use
    rho = 2 * R * np.tan(np.radians(90 + lat) / 2)
    return rho * np.sin(np.radians(lon)), rho * np.cos(np.radians(lon))
checks = []
for lat, lon in [(-89.0, 0.0), (-89.4395, 222.8066), (-86.0, 90.0), (-84.7906, 29.1957), (-80.0, 300.0)]:
    x, y = to_xy(lat, lon)
    chk = dem.fwd.transform(lon, lat)      # what pyproj says (must match the formula)
    assert abs(chk[0] - x) < 1 and abs(chk[1] - y) < 1, ("projection formula mismatch", lat, lon, chk, (x, y))
    c, r = x / STEP + N / 2 - 0.5, N / 2 - 0.5 - y / STEP
    ri, ci = int(round(r)), int(round(c))
    ok = 0 <= ri < N and 0 <= ci < N
    checks.append({"lat": lat, "lon": lon, "x_m": round(float(x), 1), "y_m": round(float(y), 1),
                   "row": round(float(r), 3), "col": round(float(c), 3),
                   "nearest_pixel_height_m": int(q[ri, ci]) if ok and q[ri, ci] != NODATA else None})
print("projection formula agrees with pyproj at all check points")

meta = {"file": "dem_polar_500m.bin", "dtype": "int16 little-endian", "n": N, "step_m": STEP, "half_m": N * STEP / 2,
        "nodata": NODATA, "layout": "row-major, row 0 = top = +y, column 0 = west = -x; pixel centres",
        "x_m": "(col + 0.5 - n/2) * step_m", "y_m": "(n/2 - 0.5 - row) * step_m",
        "projection": "south polar stereographic on a sphere, R = 1737400 m, lon 0 toward +y, east toward +x",
        "forward": "rho = 2*R*tan((90 + lat_deg)/2); x = rho*sin(lon); y = rho*cos(lon)",
        "inverse_col_row": "col = x/step + n/2 - 0.5; row = n/2 - 0.5 - y/step",
        "heights": "metres above the 1737.4 km sphere (LOLA, MOON_ME); bilinear interpolation recommended",
        "source": src[0].name + " (LOLA PGDA 90), 4 samples averaged per pixel",
        "min_m": float(np.nanmin(z)), "max_m": float(np.nanmax(z)),
        "caveat": "500 m terrain is approximate: use it for custom coordinates, not for the curated sites",
        "checks": checks}
json.dump(meta, open(OUT / "dem_polar_500m.json", "w"), indent=1)

# hillshade for the map: low Sun (as at the pole), light from azimuth 315 deg, 2x vertical exaggeration
zz = np.where(np.isfinite(z), z, np.nanmedian(z)) * 2.0
gy, gx = np.gradient(zz, STEP)             # gy is d/d(row) = -d/d(north)
dzdx, dzdy = gx, -gy
alt, az = np.radians(12), np.radians(315)
nx, ny, nz = -dzdx, -dzdy, np.ones_like(zz)
nrm = np.sqrt(nx**2 + ny**2 + nz**2)
shade = (nx * np.cos(alt) * np.sin(az) + ny * np.cos(alt) * np.cos(az) + nz * np.sin(alt)) / nrm
shade = np.clip(shade, 0, 1)
lo, hi = np.percentile(shade, [1, 99]); shade = np.clip((shade - lo) / (hi - lo), 0, 1)
rgba = np.dstack([shade, shade, shade, np.where(np.isfinite(z), 1.0, 0.0)])
plt.imsave(OUT / "hillshade_polar.png", rgba)
json.dump({"file": "hillshade_polar.png", "n": N, "step_m": STEP, "half_m": N * STEP / 2,
           "bounds_m": {"west": -N * STEP / 2, "east": N * STEP / 2, "south": -N * STEP / 2, "north": N * STEP / 2},
           "projection": meta["projection"], "forward": meta["forward"],
           "light": "azimuth 315 deg, altitude 12 deg, vertical exaggeration 2x",
           "note": "pixel (col,row) = same grid as dem_polar_500m.bin; use L.CRS.Simple with these bounds in metres"},
          open(OUT / "hillshade_polar.json", "w"), indent=1)
print("wrote dem_polar_500m.bin (%.2f MB), dem_polar_500m.json, hillshade_polar.png/.json"
      % (N * N * 2 / 1e6))
