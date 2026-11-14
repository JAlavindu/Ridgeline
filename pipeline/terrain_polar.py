"""The 500 m polar terrain (dem_polar_500m.bin) read with the same formulas the browser uses.

Shared by v14_custom_vs_precise.py (M3's accuracy test) and custom_golden.py (the browser golden test).
"""
import json
from pathlib import Path
from types import SimpleNamespace

import numpy as np
from scipy.ndimage import map_coordinates

from terrain import R

DATA = Path(__file__).resolve().parent.parent / "web" / "public" / "data"


class PolarBin:
    """South polar stereographic grid on the 1737.4 km sphere; bilinear sampling, NaN outside or no data."""

    def __init__(self):
        m = json.load(open(DATA / "dem_polar_500m.json"))
        self.n, self.step, self.nodata = m["n"], m["step_m"], m["nodata"]
        self.src = SimpleNamespace(res=(float(self.step), float(self.step)))   # what horizon() reads
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
