from app.domain.leveling import next_band, ielts_to_cefr, cefr_to_ielts, band_params, BANDS

def test_bands_order():
    assert BANDS == ["A1A2","B1","B2","C1","C2"]

def test_next_band_caps():
    assert next_band("B1") == "B2"
    assert next_band("C2") == "C2"

def test_ielts_to_cefr():
    assert ielts_to_cefr(3.5) == "A1A2"
    assert ielts_to_cefr(4.5) == "B1"
    assert ielts_to_cefr(6.0) == "B2"
    assert ielts_to_cefr(7.5) == "C1"
    assert ielts_to_cefr(9.0) == "C2"

def test_cefr_to_ielts_b2():
    assert cefr_to_ielts("B2") == (5.5, 6.5)

def test_band_params_reading_grows_with_band():
    assert band_params("reading","B1")["length"] < band_params("reading","C1")["length"]
