"""v14_near_map.py (M3): compare the precise tile with the 500 m terrain on a 21 x 21 grid (300 m spacing, +-3 km).
Run:  python pipeline/v14_near_map.py shackleton_site004
"""
import json, sys
from pathlib import Path
import numpy as np, pyproj
from scipy.ndimage import map_coordinates
from terrain import R, GEO

DATA = Path(__file__).resolve().parent.parent / "web" / "public" / "data"
m = json.load(open(DATA / "dem_polar_500m.json"))
n, step = m["n"], m["step_m"]
raw = np.fromfile(DATA / "dem_polar_500m.bin", dtype="<i2").reshape(n, n)
Z = np.where(raw == m["nodata"], np.nan, raw).astype("float32")
def polar(lon, lat):
    rho = 2 * R * np.tan(np.radians(90 + lat) / 2)
    x, y = rho * np.sin(np.radians(lon)), rho * np.cos(np.radians(lon))
    return map_coordinates(Z, [n / 2 - 0.5 - y / step, x / step + n / 2 - 0.5], order=1, mode="constant", cval=np.nan)

sid = sys.argv[1] if len(sys.argv) > 1 else "shackleton_site004"
data = json.load(open(DATA / "sites.json")); sites = data["sites"] if isinstance(data, dict) else data
s = next(x for x in sites if x["id"] == sid)
tile = np.fromfile(DATA / "tiles" / f"{sid}.bin", dtype="<i2").reshape(501, 501).astype(float)
idx = np.arange(200, 301, 5)                       # +-3 km in 300 m steps (tile cells are 60 m)
sub = tile[np.ix_(idx, idx)]                       # row 0 = north
east = (idx - 250) * 60.0; north = (250 - idx) * 60.0
X, Y = np.meshgrid(east, north)
aeqd = pyproj.CRS.from_proj4(f"+proj=aeqd +lat_0={s['lat']} +lon_0={s['lon']} +R={R} +units=m +no_defs")
lo, la = pyproj.Transformer.from_crs(aeqd, GEO, always_xy=True).transform(X.ravel(), Y.ravel())
p = polar(np.asarray(lo), np.asarray(la)).reshape(X.shape)
c = sub[10, 10]
np.set_printoptions(linewidth=250)
print("columns = west to east, rows = north to south, spacing 300 m, values in metres")
print("\nPRECISE TILE minus centre height:"); print(np.round(sub - c).astype(int))
print("\n500 m TERRAIN minus PRECISE TILE:"); print(np.round(p - sub).astype(int))
