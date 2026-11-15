import json
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent.parent / "web" / "public" / "data"


def load():
    return json.loads((DATA / "replays.json").read_text())


def test_labelled_as_plausibility():
    data = load()
    assert data["label"] == "plausibility"
    assert "never called a sunset" in data["note"]


def test_every_site_exists_and_has_a_mask():
    ids = {s["id"] for s in json.loads((DATA / "sites.json").read_text())}
    for mission in load()["missions"]:
        for site_id in mission["site_ids"]:
            assert site_id in ids
            assert (DATA / "masks" / f"{site_id}.json").exists()


def test_windows_are_inside_the_ephemeris_except_apollo11():
    for mission in load()["missions"]:
        if mission["id"] == "apollo11":
            assert mission["landing_utc"].startswith("1969")
            continue
        assert "2023-01-01" <= mission["window"]["start"] < mission["window"]["end"] <= "2033-01-01"
        assert mission["window"]["start"] <= mission["landing_utc"] <= mission["window"]["end"]


def test_every_fact_has_a_source():
    for mission in load()["missions"]:
        assert mission["facts"]
        for fact in mission["facts"]:
            assert fact["text"] and fact["source"]
