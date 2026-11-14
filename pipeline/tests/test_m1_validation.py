import json
import shutil

import pytest

import hand_check
import sensitivity
import validate
from spice_setup import load_kernels


@pytest.fixture(scope="module", autouse=True)
def kernels():
    load_kernels()


def test_hand_check_agrees_with_the_engine():
    result = hand_check.run_h1()
    assert result["outcome"] == "pass"
    assert result["result"] < 2.0   # minutes


def test_horizon_error_matches_formula_f8():
    result = sensitivity.run_s1()
    assert result["outcome"] == "pass"
    # about 0.2 h at the equator and about 12 h near the pole (plan: 0.2 and 11)
    assert 0.1 < result["details"]["0"]["measured_shift_h"] < 0.4
    assert 8 < result["details"]["-89"]["measured_shift_h"] < 16


def test_v9_is_pending_without_ground_level_masks(tmp_path, monkeypatch):
    monkeypatch.setattr(validate, "MASKS_0M", tmp_path / "none")
    assert validate.run_v9()["outcome"] == "pending"


def test_v9_logic_runs_when_masks_exist(tmp_path, monkeypatch):
    # Logic test only: 2 m masks stand in for 0 m masks. The real V9 needs M3's 0 m masks.
    for site_id in validate.V9_SITES:
        shutil.copy(validate.REPO_ROOT / "web" / "public" / "data" / "masks" / f"{site_id}.json", tmp_path / f"{site_id}.json")
    monkeypatch.setattr(validate, "MASKS_0M", tmp_path)
    result = validate.run_v9()
    assert result["outcome"] in ("pass", "fail")
    assert set(result["details"]) == set(validate.V9_SITES)
    assert result["result"] is not None

