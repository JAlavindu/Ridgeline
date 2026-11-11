import numpy as np, rasterio, pyproj
from rasterio.windows import Window
from scipy.ndimage import map_coordinates

R = 1737400.0
GEO = pyproj.CRS.from_proj4(f"+proj=longlat +R={R} +no_defs")

class Dem:
    def __init__(self, path):
        self.src = rasterio.open(path)
        crs = pyproj.CRS.from_wkt(self.src.crs.to_wkt())
        self.fwd = pyproj.Transformer.from_crs(GEO, crs, always_xy=True)
        self.scale, self.offset = self.src.scales[0], self.src.offsets[0]

    def sample(self, lon, lat):
        shape = np.shape(lon)
        x, y = self.fwd.transform(np.ravel(lon), np.ravel(lat))
        x, y = np.asarray(x), np.asarray(y)
        out = np.full(x.shape, np.nan, dtype="float32")
        b, pad = self.src.bounds, 2 * self.src.res[0]
        x0, x1 = max(x.min() - pad, b.left), min(x.max() + pad, b.right)
        y0, y1 = max(y.min() - pad, b.bottom), min(y.max() + pad, b.top)
        if x0 >= x1 or y0 >= y1:
            return out.reshape(shape)
        r0, c0 = self.src.index(x0, y1)
        r1, c1 = self.src.index(x1, y0)
        win = Window(c0, r0, c1 - c0 + 1, r1 - r0 + 1)
        z = self.src.read(1, window=win, masked=True).astype("float32").filled(np.nan)
        z = z * self.scale + self.offset
        t = self.src.window_transform(win)
        col = (x - t.c) / t.a - 0.5          # pixel centres sit at integer indices
        row = (y - t.f) / t.e - 0.5
        out[:] = map_coordinates(z, [row, col], order=1, mode="constant", cval=np.nan)
        return out.reshape(shape)

def sample_chain(dems, lon, lat):
    """Finest DEM first; any NaN is filled from the next, coarser one."""
    out = dems[0].sample(lon, lat)
    for d in dems[1:]:
        bad = np.isnan(out)
        if not bad.any():
            break
        out[bad] = d.sample(lon[bad], lat[bad])
    return out