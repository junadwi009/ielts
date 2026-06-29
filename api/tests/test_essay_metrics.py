"""
TDD tests for essay_metrics.py
Run: cd api && .venv/Scripts/python -m pytest tests/test_essay_metrics.py -v
"""
from app.services.essay_metrics import compute_metrics

SAMPLE = (
    "In my opinion, learning about food science is important. "
    "Students who understand nutrition can avoid illness later in life. "
    "However, school time is limited and many subjects compete for attention. "
    "Therefore, a balanced approach that includes both academic subjects and "
    "practical cooking lessons would benefit students the most."
)


def test_metrics_shape():
    m = compute_metrics(SAMPLE)
    assert m["wordCount"] > 30
    assert m["sentenceCount"] >= 3
    assert "fleschKincaidGrade" in m["readability"]
    assert "ttr" in m["lexicalDiversity"]
    # syntax may be None if spaCy model unavailable in CI, but with the baked model it should be a dict
    assert m["syntax"] is None or "meanSentenceLength" in m["syntax"]


def test_metrics_empty_safe():
    m = compute_metrics("")
    assert m["wordCount"] == 0   # no exception


def test_metrics_readability_keys():
    m = compute_metrics(SAMPLE)
    r = m["readability"]
    assert "fleschReadingEase" in r
    assert "fleschKincaidGrade" in r
    assert "gunningFog" in r
    # values should be floats
    assert isinstance(r["fleschKincaidGrade"], float)


def test_metrics_lexical_diversity_keys():
    m = compute_metrics(SAMPLE)
    ld = m["lexicalDiversity"]
    assert "ttr" in ld
    assert "mtld" in ld
    assert isinstance(ld["ttr"], float)
    # mtld can be None if text too short, but SAMPLE is long enough
    assert ld["mtld"] is not None


def test_metrics_syntax_keys():
    m = compute_metrics(SAMPLE)
    if m["syntax"] is not None:
        s = m["syntax"]
        assert "meanSentenceLength" in s
        assert "meanDependencyDepth" in s
        assert "nLongWords" in s


def test_metrics_short_input():
    # Very short input should not raise
    m = compute_metrics("Hello world.")
    assert m["wordCount"] >= 0
    # mtld may be None for short texts
    assert m["lexicalDiversity"]["mtld"] is None or isinstance(
        m["lexicalDiversity"]["mtld"], float
    )


def test_metrics_no_exception_on_whitespace():
    m = compute_metrics("   ")
    assert m["wordCount"] == 0
