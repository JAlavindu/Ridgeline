"""v14_custom_vs_precise.py (M3): how good is a horizon computed from the 500 m polar terrain
(the one used for custom coordinates) compared with our precise masks?
Run from the Ridgeline folder:  python pipeline/v14_custom_vs_precise.py
Reads web/public/data/dem_polar_500m.bin/.json and web/public/data/masks/<id>.json (the precise masks).
Writes docs/validation/v14_custom_vs_precise.json and one PNG per site.
"""
import json, sys
from pathlib import Path
import numpy as np
from scipy.ndimage import map_coordinates
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from terrain import R
from horizon import horizon

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "web" / "public" / "data"
OUT = ROOT / "docs" / "validation"
OUT.mkdir(parents=True, exist_ok=True)
STEP_FRAC, H_OBS = 0.005, 2.0                     # same as write_masks.py

class PolarBin:
    """The 500 m polar terrain, read with the SAME formulas M5 will use in the browser."""
    def __init__(self):
        m = json.load(open(DATA / "dem_polar_500m.json"))
        self.n, self.step, self.nodata = m["n"], m["step_m"], m["nodata"]
        m = json.load(open(DATA / "dem_polar_500m.json"))
        self.n, self.step, self.nodata = m["n"], m["step_m"], m["nodata"]
        from types import SimpleNamespace
        self.src = SimpleNamespace(res=(float(self.step), float(self.step)))
        raw = np.fromfile(DATA / "dem_polar_500m.bin", dtype="<i2").reshape(self.n, self.n)
        raw = np.fromfile(DATA / "dem_polar_500m.bin", dtype="<i2").reshape(self.n, self.n)
        self.z = np.where(raw == self.nodata, np.nan, raw).astype("float32")
    def sample(self, lon, lat):
        lon, lat = np.asarray(lon, float), np.asarray(lat, float)
        shape = lon.shape
        rho = 2 * R * np.tan(np.radians(90 + np.ravel(lat)) / 2)
        x, y = rho * np.sin(np.radians(np.ravel(lon))), rho * np.cos(np.radians(np.ravel(lon)))
        col = x / self.step + self.n / 2 - 0.5
        row = self.n / 2 - 0.5 - y / self.step
        out = map_coordinates(self.z, [row, col], order=1, mode="constant", cval=np.nan)
        return out.astype("float32").reshape(shape)

sites_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DATA / "sites.json"
data = json.loads(sites_path.read_text()); sites = data["sites"] if isinstance(data, dict) else data
polar = PolarBin()
results = []
print(f"{'site':22s} {'bias':>7s} {'rms':>7s} {'p95':>7s} {'max':>7s}   (degrees, custom minus precise)")
for s in sites:
    mp = DATA / "masks" / f"{s['id']}.json"
    if not mp.exists() or s["id"].startswith("dev_"):
        continue
    mask = json.load(open(mp))
    az = np.arange(0.0, 360.0, mask["az_step_deg"])
    far_km = 250 if s["lat"] <= -88 else 150
    best, h_site = horizon(s["lat"], s["lon"] % 360, [([polar], 0, far_km * 1000)], az, h_obs=H_OBS, step_frac=STEP_FRAC)
    custom = np.asarray(best, float)
    precise = np.asarray(mask["elev_deg"], float)
    if custom.shape != precise.shape:
        print(f"skip {s['id']}: {custom.shape} values vs {precise.shape} in the mask"); continue
    ok = np.isfinite(custom) & np.isfinite(precise)
    d = (custom - precise)[ok]
    r = {"id": s["id"], "n_nan_custom": int((~np.isfinite(custom)).sum()), "bias_deg": float(d.mean()),
         "rms_deg": float(np.sqrt((d ** 2).mean())), "p95_abs_deg": float(np.percentile(np.abs(d), 95)),
         "max_abs_deg": float(np.abs(d).max()), "site_height_custom_m": float(h_site),
         "site_height_precise_m": mask.get("site_height_m")}
    results.append(r)
    print(f"{s['id']:22s} {r['bias_deg']:7.3f} {r['rms_deg']:7.3f} {r['p95_abs_deg']:7.3f} {r['max_abs_deg']:7.3f}"
          + (f"   NaN in custom: {r['n_nan_custom']}" if r["n_nan_custom"] else ""))
    fig, ax = plt.subplots(figsize=(9, 3.2))
    ax.plot(az, precise, label="precise (20/80/240 m)", lw=1.4)
    ax.plot(az, custom, label="custom (500 m)", lw=1.0, ls="--")
    ax.set_xlabel("azimuth (deg, clockwise from north)"); ax.set_ylabel("horizon elevation (deg)")
    ax.set_title(f"{s['id']}: rms {r['rms_deg']:.2f} deg, max {r['max_abs_deg']:.2f} deg"); ax.legend(); ax.grid(alpha=.3)
    fig.tight_layout(); fig.savefig(OUT / f"v14_{s['id']}.png", dpi=110); plt.close(fig)

if results:
    worst = max(r["p95_abs_deg"] for r in results)
    label = float(np.ceil(worst * 2) / 2)             # round up to the next 0.5 deg
    summary = {"sites": results, "suggested_label_deg": label,
               "rule": "label = worst-site 95th percentile of |custom - precise|, rounded up to 0.5 deg"}
    json.dump(summary, open(OUT / "v14_custom_vs_precise.json", "w"), indent=1)
    print(f"\nSuggested label for custom-coordinate horizons: approximate, about +/- {label:g} deg (typical).")
    print("Look at the PNGs in docs/validation/ before deciding.")
else:
    print("No masks found to compare.")
