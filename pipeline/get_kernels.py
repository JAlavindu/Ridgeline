from pathlib import Path

import requests

BASE_URL = "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/"

KERNELS = [
    "lsk/naif0012.tls",                                   # leap seconds (UTC <-> TDB)
    "pck/pck00011.tpc",                                   # body sizes (Moon radius 1737.4 km)
    "spk/planets/de440s.bsp",                             # Sun, Earth, Moon positions
    "pck/moon_pa_de440_200625.bpc",                       # Moon orientation, incl. libration
    "fk/satellites/moon_de440_250416.tf",                 # Moon frames, incl. MOON_ME
    "fk/satellites/a_old_versions/moon_de440_220930.tf",  # old frame file, only for comparison
]

KERNEL_DIR = Path(__file__).resolve().parent / "kernels"


def download(remote_path: str) -> Path:
    """Download one kernel unless it is already on disk. Returns its local path."""
    file_name = remote_path.split("/")[-1]
    target = KERNEL_DIR / file_name

    if target.exists():
        print(f"already have {file_name} ({target.stat().st_size:,} bytes)")
        return target

    url = BASE_URL + remote_path
    print(f"downloading {url} ...")
    response = requests.get(url, stream=True, timeout=60)
    response.raise_for_status()

    partial = target.with_suffix(target.suffix + ".part")
    with open(partial, "wb") as f:
        for chunk in response.iter_content(chunk_size=1024 * 1024):
            f.write(chunk)
    partial.rename(target)

    print(f"saved {file_name} ({target.stat().st_size:,} bytes)")
    return target


def main() -> None:
    KERNEL_DIR.mkdir(exist_ok=True)
    for remote_path in KERNELS:
        download(remote_path)
    print("All kernels present in", KERNEL_DIR)


if __name__ == "__main__":
    main()
