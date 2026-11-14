"""Golden file for the browser's custom-coordinate horizon (web/src/engine/customHorizon.ts).

Same method as M3's V14 test: 500 m polar terrain, one ring to 150 km (250 km poleward of 88 S),
0.25 deg azimuths, 2 m mast, step = max(500 m, 0.5% of the distance).
Run:  python pipeline/custom_golden.py
"""
import json
from pathlib import Path

import numpy as np

from horizon import horizon
from terrain_polar import PolarBin

OUT = Path(__file__).resolve().parent.parent / "web" / "src" / "engine" / "tests" / "custom_horizon_golden.json"
CASES = [("connecting_ridge", -89.4395, 222.8066), ("lat80_lon300", -80.0, 300.0),
         ("lat86_lon90", -86.0, 90.0), ("pole", -90.0, 0.0)]
AZ_STEP, STEP_FRAC, H_OBS = 0.25, 0.005, 2.0


class PolarBin64(PolarBin):
    """Same sampling, returned as float64. With float32 heights NumPy 2 keeps R + h in float32, which
    rounds the radius to 0.125 m (up to ~0.014 deg at 500 m). The golden file should be exact."""

    def sample(self, lon, lat):
        return super().sample(lon, lat).astype("float64")


def main() -> None:
    polar = PolarBin64()
    az = np.arange(0.0, 360.0, AZ_STEP)
    cases = []
    for name, lat, lon in CASES:
        far_km = 250 if lat <= -88 else 150
        best, h_site = horizon(lat, lon % 360, [([polar], 0, far_km * 1000)], az, h_obs=H_OBS, step_frac=STEP_FRAC)
        cases.append({"name": name, "lat": lat, "lon": lon, "h_obs": H_OBS, "site_height_m": float(h_site),
                      "elev_deg": [round(float(v), 6) for v in best]})
        print(f"{name:16s} site {h_site:7.1f} m  horizon {np.min(best):6.2f} .. {np.max(best):5.2f} deg")
    OUT.write_text(json.dumps({"generator": "pipeline/custom_golden.py", "az_step_deg": AZ_STEP,
                               "step_frac": STEP_FRAC, "cases": cases}) + "\n")
    print("Wrote", OUT.name)


if __name__ == "__main__":
    main()
