"""v14_diagnose.py (M3): where does the 500 m horizon go wrong? Splits the horizon into NEAR (< 3 km)
and FAR (> 3 km) parts for one site and compares precise terrain with the 500 m terrain.
Run:  python pipeline/v14_diagnose.py shackleton_site004
"""
import json, sys
from pathlib import Path
from types import SimpleNamespace
import numpy as np
from scipy.ndimage import map_coordinates
from terrain import Dem, R
from horizon import horizon

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "web" / "public" / "data"
TER = ROOT / "pipeline" / "data" / "terrain"
SPLIT = 3000.0

class PolarBin:
    def __init__(self):
        m = json.load(open(DATA / "dem_polar_500m.json"))
        self.n, self.step, self.nodata = m["n"], m["step_m"], m["nodata"]
        self.src = SimpleNamespace(res=(float(self.step), float(self.step)))
        raw = np.fromfile(DATA / "dem_polar_500m.bin", dtype="<i2").reshape(self.n, self.n)
        self.z = np.where(raw == self.nodata, np.nan, raw).astype("float32")
    def sample(self, lon, lat):
        lon, lat = np.asarray(lon, float), np.asarray(lat, float)
        shape = lon.shape
        rho = 2 * R * np.tan(np.radians(90 + np.ravel(lat)) / 2)
        x, y = rho * np.sin(np.radians(np.ravel(lon))), rho * np.cos(np.radians(np.ravel(lon)))
        col = x / self.step + self.n / 2 - 0.5
        row = self.n / 2 - 0.5 - y / self.step
        return map_coordinates(self.z, [row, col], order=1, mode="constant", cval=np.nan).astype("float32").reshape(shape)

def find(pattern):
    f = sorted(TER.glob(pattern))
    if not f:
        sys.exit(f"not found in {TER}: {pattern}")
    return Dem(f[0])

sid = sys.argv[1] if len(sys.argv) > 1 else "shackleton_site004"
data = json.load(open(DATA / "sites.json")); sites = data["sites"] if isinstance(data, dict) else data
s = next(x for x in sites if x["id"] == sid)
lat, lon = s["lat"], s["lon"] % 360
d20, d80, d240 = find("LDEM_80S_20MPP_ADJ*.TIF"), find("LDEM_80S_80MPP_ADJ*.TIF"), find("LDEM_60S_240MPP_ADJ*.TIF")
polar = PolarBin()
az = np.arange(0.0, 360.0, 0.25)
far_m = (250 if lat <= -88 else 150) * 1000
kw = dict(h_obs=2.0, step_frac=0.005)
pn, hp = horizon(lat, lon, [([d20, d240], 0, SPLIT)], az, **kw)
cn, hc = horizon(lat, lon, [([polar], 0, SPLIT)], az, **kw)
pf, _ = horizon(lat, lon, [([d20, d240], SPLIT, 40000), ([d80, d240], 40000, far_m)], az, **kw)
cf, _ = horizon(lat, lon, [([polar], SPLIT, far_m)], az, **kw)
pn, cn, pf, cf = (np.asarray(v, float) for v in (pn, cn, pf, cf))
pt, ct = np.fmax(pn, pf), np.fmax(cn, cf)
print(f"{sid}: site height precise {hp:.1f} m, 500 m terrain {hc:.1f} m")
def row(name, p, c):
    d = c - p
    print(f"{name:34s} precise mean {np.nanmean(p):6.2f}  custom mean {np.nanmean(c):6.2f}  custom-precise mean {np.nanmean(d):6.2f}  rms {np.sqrt(np.nanmean(d**2)):6.2f}")
row("NEAR (< 3 km)", pn, cn)
row("FAR (> 3 km)", pf, cf)
row("TOTAL (max of both)", pt, ct)
print(f"directions where the precise skyline is set by the NEAR part: {100*np.mean(pn >= pf):.0f} %")
