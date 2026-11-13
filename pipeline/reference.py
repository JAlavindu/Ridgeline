"""reference.py (M3): NASA PGDA 69 average Sun and Earth visibility at each site, plus
6 x 6 km site-centred crops for the neighbourhood map.
Run from the Ridgeline folder:  python pipeline/reference.py [path/to/sites.json]
"""
import json, sys
from pathlib import Path
import numpy as np, pyproj
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from terrain import Dem, R, GEO, sample_chain

ROOT = Path(__file__).resolve().parent.parent
ILL = ROOT / "pipeline" / "data" / "illum"
NBHD = ROOT / "web" / "public" / "data" / "nbhd"
OUT = ROOT / "pipeline" / "out"
SITES = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "web" / "public" / "data" / "sites.json"
HALF, STEP = 3000, 60            # 6 x 6 km, 101 x 101 values (the NASA map has 60 m pixels)

# Finest first. The 75S files (120 m) are optional: they are used only if you downloaded them.
SUN_FILES = ["AVGVISIB_85S_060M_201608.TIF", "AVGVISIB_75S_120M_201608.TIF"]
EARTH_FILES = ["AVGVISIB_85S_060M_201608_EARTH.TIF", "AVGVISIB_75S_120M_201608_EARTH.TIF"]
sun_f = [f for f in SUN_FILES if (ILL / f).exists()]
earth_f = [f for f in EARTH_FILES if (ILL / f).exists()]
if not sun_f or not earth_f:
    sys.exit("No PGDA 69 files found in pipeline/data/illum")
sun = [Dem(ILL / f) for f in sun_f]
earth = [Dem(ILL / f) for f in earth_f]
for d, f in zip(sun + earth, sun_f + earth_f):
    print(f"{f}: scale {d.scale}, offset {d.offset}, bounds {tuple(round(v) for v in d.src.bounds)}")

def rnd(v):
    return None if v is None or not np.isfinite(v) else round(float(v), 4)

def site_grid(lat, lon):
    lat = max(lat, -89.999999)
    aeqd = pyproj.CRS.from_proj4(f"+proj=aeqd +lat_0={lat} +lon_0={lon} +R={R} +units=m +no_defs")
    inv = pyproj.Transformer.from_crs(aeqd, GEO, always_xy=True)
    xs = np.arange(-HALF, HALF + 1, STEP)
    X, Y = np.meshgrid(xs, xs[::-1])              # row 0 = north, column 0 = west (same as the tiles)
    lo, la = inv.transform(X.ravel(), Y.ravel())
    return xs, np.asarray(lo), np.asarray(la), X.shape

if SITES.exists():
    data = json.loads(SITES.read_text()); sites = data["sites"] if isinstance(data, dict) else data
else:
    sites = [{"id": "test_connecting_ridge", "lat": -89.4395, "lon": 222.8066}]
NBHD.mkdir(parents=True, exist_ok=True); OUT.mkdir(parents=True, exist_ok=True)
cmap = matplotlib.colormaps["viridis"].copy(); cmap.set_bad((0, 0, 0, 0))

for s in sites:
    sid, lat, lon = s["id"], s["lat"], s["lon"] % 360
    xs, lo, la, shape = site_grid(lat, lon)
    sg = sample_chain(sun, lo, la).reshape(shape)
    eg = sample_chain(earth, lo, la).reshape(shape)
    cover = float(np.isfinite(sg).mean())
    if cover < 0.5:
        print(f"skip {sid}: only {cover:.0%} of its crop is inside the maps you downloaded (needs the 75S files)")
        continue
    c = shape[0] // 2                              # the centre cell is the site itself
    plt.imsave(NBHD / f"{sid}.png", np.ma.masked_invalid(sg), cmap=cmap, vmin=0, vmax=1)
    meta = {"id": sid, "lat": s["lat"], "lon": s["lon"], "n": int(shape[0]), "step_m": STEP, "half_m": HALF,
            "orientation": "row 0 = north (top), column 0 = west (left); same grid as tiles/<id>.json",
            "colormap": "viridis", "vmin": 0, "vmax": 1,
            "legend": "fraction of time the Sun is above the horizon (0 = never, 1 = always)",
            "sun_at_site": rnd(sg[c, c]), "earth_at_site": rnd(eg[c, c]),
            "sun_crop_median": rnd(np.nanmedian(sg)), "earth_crop_median": rnd(np.nanmedian(eg)),
            "crop_coverage": round(cover, 3), "files": sun_f + earth_f,
            "source": "NASA GSFC PGDA product 69 (LOLA; Mazarico et al. 2011): average over the lunar nutation "
                      "cycle (about 18.6 years), hourly steps, at ground level",
            "earth_rule": "Earth counts as visible if any part of its disc is above the horizon"}
    json.dump(meta, open(NBHD / f"{sid}.json", "w"), indent=1)
    np.savez_compressed(OUT / f"nbhd_{sid}.npz", sun=sg.astype("float32"), earth=eg.astype("float32"),
                        lon=lo.reshape(shape), lat=la.reshape(shape), xs=xs)
    print(f"{sid:24s} Sun {sg[c, c]:6.1%} (crop median {np.nanmedian(sg):6.1%})   "
          f"Earth {eg[c, c]:6.1%} (crop median {np.nanmedian(eg):6.1%})   coverage {cover:.0%}")
