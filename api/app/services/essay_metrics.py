"""
Deterministic essay-quality metrics for Writing evaluation.

Libraries used:
  - textstat     : readability formulas (Flesch, Gunning Fog, etc.)
  - lexicalrichness : TTR and MTLD lexical diversity
  - spaCy + textdescriptives : syntactic complexity (dependency distance,
                                sentence length from parsed doc)

The spaCy pipeline is loaded ONCE as a module-level singleton on first call.
If the model is missing or spaCy is unavailable, the syntax section degrades
gracefully to None — never raises.

Return shape (camelCase):
{
  "wordCount": int,
  "sentenceCount": int,
  "readability": {
    "fleschReadingEase": float,
    "fleschKincaidGrade": float,
    "gunningFog": float,
  },
  "lexicalDiversity": {
    "ttr": float,
    "mtld": float | None,
  },
  "syntax": {
    "meanSentenceLength": float | None,
    "meanDependencyDepth": float | None,
    "nLongWords": int | None,
  } | None,
}
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# spaCy singleton
# ---------------------------------------------------------------------------

_nlp = None          # lazily loaded; None means not yet attempted
_nlp_attempted = False  # set True after first load attempt


def _get_nlp():
    """
    Load the spaCy pipeline with TextDescriptives components, exactly once.
    Returns None (and logs a warning) if the model or libraries are unavailable.
    """
    global _nlp, _nlp_attempted
    if _nlp_attempted:
        return _nlp
    _nlp_attempted = True
    try:
        import spacy  # noqa: F401 — guard import
        import textdescriptives  # noqa: F401 — REQUIRED: importing registers the
        # spaCy factories ('textdescriptives/...'). Without this import, add_pipe
        # raises E002 "Can't find factory" in a fresh process (e.g. the container).
        nlp = spacy.load("en_core_web_sm")
        # Add only the components we need to avoid the broken 'quality' component
        nlp.add_pipe("textdescriptives/dependency_distance")
        nlp.add_pipe("textdescriptives/descriptive_stats")
        _nlp = nlp
        logger.info("essay_metrics: spaCy pipeline loaded (en_core_web_sm + textdescriptives)")
    except Exception as exc:  # noqa: BLE001
        logger.warning("essay_metrics: spaCy unavailable — syntax section will be None. %s", exc)
        _nlp = None
    return _nlp


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def compute_metrics(essay: str) -> dict:
    """
    Compute deterministic essay-quality metrics.

    Degrades gracefully:
    - Empty / whitespace-only input → returns zeros/None, never raises.
    - spaCy unavailable → syntax section is None.
    - MTLD on <50-token text → mtld is None.

    Parameters
    ----------
    essay : str
        The raw essay text from the learner.

    Returns
    -------
    dict
        Metrics dictionary in camelCase (see module docstring).
    """
    text = (essay or "").strip()

    # --- Guard: empty / too short ---
    if not text:
        return _empty_metrics()

    word_count = len(text.split())
    if word_count == 0:
        return _empty_metrics()

    # --- Readability (textstat) ---
    readability = _compute_readability(text)

    # --- Sentence count (simple heuristic; spaCy may refine below) ---
    import re as _re
    sentence_count = max(1, len(_re.split(r"[.!?]+", text.rstrip(".!? "))))

    # --- Lexical diversity (LexicalRichness) ---
    lexical_diversity = _compute_lexical_diversity(text)

    # --- Syntax (spaCy + TextDescriptives) ---
    syntax, sentence_count_spacy = _compute_syntax(text)
    # Prefer spaCy's sentence count when available
    if sentence_count_spacy is not None:
        sentence_count = sentence_count_spacy

    return {
        "wordCount": word_count,
        "sentenceCount": sentence_count,
        "readability": readability,
        "lexicalDiversity": lexical_diversity,
        "syntax": syntax,
    }


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _empty_metrics() -> dict:
    return {
        "wordCount": 0,
        "sentenceCount": 0,
        "readability": {
            "fleschReadingEase": 0.0,
            "fleschKincaidGrade": 0.0,
            "gunningFog": 0.0,
        },
        "lexicalDiversity": {
            "ttr": 0.0,
            "mtld": None,
        },
        "syntax": None,
    }


def _round(value, ndigits: int = 2) -> float:
    """Safe float round; returns 0.0 if value is not finite."""
    import math
    try:
        f = float(value)
        if not math.isfinite(f):
            return 0.0
        return round(f, ndigits)
    except (TypeError, ValueError):
        return 0.0


def _compute_readability(text: str) -> dict:
    try:
        import textstat
        return {
            "fleschReadingEase": _round(textstat.flesch_reading_ease(text), 1),
            "fleschKincaidGrade": _round(textstat.flesch_kincaid_grade(text), 1),
            "gunningFog": _round(textstat.gunning_fog(text), 1),
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("essay_metrics: readability error — %s", exc)
        return {
            "fleschReadingEase": 0.0,
            "fleschKincaidGrade": 0.0,
            "gunningFog": 0.0,
        }


def _compute_lexical_diversity(text: str) -> dict:
    try:
        from lexicalrichness import LexicalRichness
        lr = LexicalRichness(text)
        ttr = _round(lr.ttr, 2)
        mtld: float | None = None
        try:
            mtld = _round(lr.mtld(), 1)
        except Exception:  # noqa: BLE001
            # Throws on very short texts (<50 tokens)
            mtld = None
        return {"ttr": ttr, "mtld": mtld}
    except Exception as exc:  # noqa: BLE001
        logger.warning("essay_metrics: lexical diversity error — %s", exc)
        return {"ttr": 0.0, "mtld": None}


def _compute_syntax(text: str) -> tuple[dict | None, int | None]:
    """
    Returns (syntax_dict_or_None, sentence_count_or_None).
    sentence_count comes from spaCy's sents, which is more accurate.
    """
    nlp = _get_nlp()
    if nlp is None:
        return None, None

    try:
        doc = nlp(text)

        # Sentence count from spaCy
        sents = list(doc.sents)
        sentence_count = len(sents)

        # Mean sentence length (tokens per sentence) from textdescriptives descriptive_stats
        mean_sent_len: float | None = None
        try:
            ds = doc._.descriptive_stats
            if ds and "sentence_length_mean" in ds:
                mean_sent_len = _round(ds["sentence_length_mean"], 1)
        except Exception:  # noqa: BLE001
            pass

        # Mean dependency depth from textdescriptives dependency_distance
        mean_dep_depth: float | None = None
        try:
            dd = doc._.dependency_distance
            if dd and "dependency_distance_mean" in dd:
                mean_dep_depth = _round(dd["dependency_distance_mean"], 2)
        except Exception:  # noqa: BLE001
            pass

        # Count long words (>= 7 characters, non-punctuation tokens)
        n_long_words: int | None = None
        try:
            n_long_words = sum(
                1 for tok in doc
                if not tok.is_punct and not tok.is_space and len(tok.text) >= 7
            )
        except Exception:  # noqa: BLE001
            pass

        syntax = {
            "meanSentenceLength": mean_sent_len,
            "meanDependencyDepth": mean_dep_depth,
            "nLongWords": n_long_words,
        }
        return syntax, sentence_count

    except Exception as exc:  # noqa: BLE001
        logger.warning("essay_metrics: syntax error — %s", exc)
        return None, None
