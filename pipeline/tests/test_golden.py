import json
from pathlib import Path

import golden

GOLDEN_FILE = golden.GOLDEN_FILE
META = Path(golden.REPO_ROOT) / "web" / "public" / "data" / "ephem_meta.json"


def load():
    return json.loads(GOLDEN_FILE.read_text())


def test_golden_file_has_1000_cases():
    data = load()
    assert data["count"] == 1000
    assert len(data["cases"]) == 1000


def test_every_time_is_inside_the_ephemeris_file():
    meta = json.loads(META.read_text())
    first = meta["start_tdb_s"]
    last = first + (meta["count"] - 1) * meta["step_s"]
    for case in load()["cases"]:
        assert first <= case["tdb_s"] <= last


def test_cases_are_reproducible_from_the_seed():
    import numpy as np
    specs = golden.build_specs(np.random.default_rng(golden.SEED))
    stored = load()["cases"]
    assert len(specs) == 1000
    for spec, case in list(zip(specs, stored))[:5] + list(zip(specs, stored))[-5:]:
        for key in ("lat", "lon", "ground_m", "mast_m", "utc"):
            assert case[key] == spec[key]
