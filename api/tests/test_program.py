from app.domain.program import build_milestones

def test_milestone_counts():
    ms = build_milestones(90, {"reading":"C1","writing":"B1","listening":"B1","speaking":"B1"}, 6.5)
    assert len(ms) == 4
    assert ms[0]["dayTarget"] < ms[-1]["dayTarget"] == 90
    # writing ramps up over time, never exceeds target cefr (B2 for 6.5)
    assert ms[-1]["targets"]["writing"] in ("B2","C1")

def test_milestone_counts_30_and_180():
    assert len(build_milestones(30, {"reading":"B1","writing":"B1","listening":"B1","speaking":"B1"}, 6.0)) == 2
    assert len(build_milestones(180, {"reading":"B1","writing":"B1","listening":"B1","speaking":"B1"}, 7.0)) == 6

def test_skill_above_target_not_downgraded():
    ms = build_milestones(90, {"reading":"C1","writing":"B1","listening":"B1","speaking":"B1"}, 6.5)  # target B2
    for m in ms:
        assert m["targets"]["reading"] == "C1"  # already above target, stays
