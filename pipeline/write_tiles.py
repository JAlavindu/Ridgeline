import json
import sys
import numpy as np, pyproj
from pathlib import Path
from terrain import Dem, R, GEO, sample_chain

ROOT = Path(__file__).resolve().parent.parent
T = ROOT / "pipeline" / "data" / "terrain"
OUT = ROOT / "web" / "public" / "data" / "tiles"
SITES = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "web" / "public" / "data" / "sites.json"
d20, d240 = Dem(T / "LDEM_80S_20MPP_ADJ.TIF"), Dem(T / "LDEM_60S_240MPP_ADJ.TIF")
HALF, STEP = 15_000, 60            # 30 x 30 km at 60 m: 501 x 501 values, about 0.5 MB

def make_tile(lat, lon):
    lat = max(lat, -89.999999)
    aeqd = pyproj.CRS.from_proj4(f"+proj=aeqd +lat_0={lat} +lon_0={lon} +R={R} +units=m +no_defs")
    inv = pyproj.Transformer.from_crs(aeqd, GEO, always_xy=True)
    xs = np.arange(-HALF, HALF + 1, STEP)
    X, Y = np.meshgrid(xs, xs[::-1])               # row 0 = north, column 0 = west
    lo, la = inv.transform(X.ravel(), Y.ravel())
    z = sample_chain([d20, d240], np.array(lo), np.array(la)).reshape(X.shape)
    return z

if SITES.exists():
    data = json.loads(SITES.read_text()); sites = data["sites"] if isinstance(data, dict) else data
else:
    sites = [{"id": "test_connecting_ridge", "lat": -89.4395, "lon": 222.8066}]
OUT.mkdir(parents=True, exist_ok=True)
for s in sites:
    if s["lat"] > -80:
        print("skip", s["id"]); continue
    z = make_tile(s["lat"], s["lon"] % 360)
    nan = int(np.isnan(z).sum())
    i16 = np.where(np.isnan(z), -32768, np.round(z)).astype("<i2")
    (OUT / f"{s['id']}.bin").write_bytes(i16.tobytes())
    json.dump({"id": s["id"], "lat": s["lat"], "lon": s["lon"], "projection": "aeqd centred on the site, R=1737400",
               "n": int(z.shape[0]), "step_m": STEP, "half_m": HALF, "dtype": "int16", "byte_order": "little",
               "units": "metres above the 1737.4 km reference sphere", "nodata": -32768,
               "orientation": "row 0 = north (top), column 0 = west (left); azimuth 0 = up",
               "height_min_m": float(np.nanmin(z)), "height_max_m": float(np.nanmax(z))},
              open(OUT / f"{s['id']}.json", "w"), indent=1)
    print(f"{s['id']:24s} {z.shape}  height {np.nanmin(z):7.0f}..{np.nanmax(z):6.0f} m  missing {nan}")
