import json

from geometry import Site
from illumination import MASK_DIR, is_real_mask, load_site_mask


def test_placeholder_masks_are_not_real():
    assert not is_real_mask(json.loads((MASK_DIR / "apollo11.json").read_text()))


def test_lola_masks_are_real():
    assert is_real_mask(json.loads((MASK_DIR / "im1.json").read_text()))


def test_placeholder_site_falls_back_to_smooth_moon():
    mask, label = load_site_mask("chandrayaan3_isro", Site(-69.37, 32.35))
    assert label == "smooth Moon"
    assert max(mask["elev_deg"]) < 0


def test_real_site_keeps_its_terrain():
    mask, label = load_site_mask("im1", Site(-80.13, 1.44, 2592.0))
    assert label == "LOLA terrain"
    assert max(mask["elev_deg"]) > 0


def test_replays_json_labels_the_horizon():
    data = json.loads((MASK_DIR.parent / "replays.json").read_text())
    chandrayaan = next(m for m in data["missions"] if m["id"] == "chandrayaan3")
    assert all(s["horizon"] == "smooth Moon" for s in chandrayaan["sites"].values())
