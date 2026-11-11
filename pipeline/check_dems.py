import glob, rasterio
for p in sorted(glob.glob("pipeline/data/terrain/*.TIF")):
    with rasterio.open(p) as s:
        print(p.split("/")[-1], s.shape, s.res, s.bounds)
        print("  scale/offset/nodata:", s.scales[0], s.offsets[0], s.nodata, s.dtypes[0])
        print("  pole pixel:", s.index(0, 0))