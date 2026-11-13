import json, time
import sys
import numpy as np
from pathlib import Path
from terrain import Dem
from horizon import horizon

ROOT = Path(__file__).resolve().parent.parent
T = ROOT / "pipeline" / "data" / "terrain"
OUT = ROOT / "web" / "public" / "data" / "masks"
SITES = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "web" / "public" / "data" / "sites.json"

AZ_STEP = 0.25                  # 1440 directions; confirm with M5, the contract says az_step_deg
STEP_FRAC = 0.005
H_OBS = 2.0

d20, d80, d240 = (Dem(T / f) for f in ("LDEM_80S_20MPP_ADJ.TIF", "LDEM_80S_80MPP_ADJ.TIF", "LDEM_60S_240MPP_ADJ.TIF"))
az = np.arange(0, 360, AZ_STEP)

if SITES.exists():
    data = json.loads(SITES.read_text())
    sites = data["sites"] if isinstance(data, dict) else data
else:
    print("sites.json not found: using one test site only (do not commit this mask as final)")
    sites = [{"id": "test_connecting_ridge", "lat": -89.4395, "lon": 222.8066}]

OUT.mkdir(parents=True, exist_ok=True)
for s in sites:
    lat, lon = s["lat"], s["lon"] % 360
    if lat > -80:                               # needs the 118 m USGS map or smooth-Moon handling
        print(f"skip {s['id']}: latitude {lat} is outside the 80-90S files")
        continue
    far_km = 250 if lat <= -88 else 150         # plan decision D11
    rings = [([d20, d240], 0, 40_000), ([d80, d240], 40_000, far_km * 1000)]
    t0 = time.time()
    hz, h0 = horizon(lat, lon, rings, az, h_obs=H_OBS, step_frac=STEP_FRAC)
    bad = int((hz <= -89.9).sum())
    json.dump({"az_step_deg": AZ_STEP, "elev_deg": np.round(hz, 4).tolist(),
               "elev_lo_deg": None, "elev_hi_deg": None, "radius_km": far_km,
               "dems_used": ["LDEM_80S_20MPP_ADJ", "LDEM_80S_80MPP_ADJ", "LDEM_60S_240MPP_ADJ"],
               "observer_height_m": H_OBS, "site_height_m": round(float(h0), 1)},
              open(OUT / f"{s['id']}.json", "w"))
    print(f"{s['id']:24s} h={h0:7.1f} m  horizon {hz.min():6.2f}..{hz.max():5.2f} deg  no-data {bad}  {time.time()-t0:.0f}s")
