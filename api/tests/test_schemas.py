import pytest
from pydantic import ValidationError
from app.schemas import OnboardingIn, ProgramIn


def test_onboarding_valid():
    m = OnboardingIn(name="A", goal="work", targetBand=6.5)
    assert m.target_band == 6.5


def test_onboarding_rejects_bad_goal():
    with pytest.raises(ValidationError):
        OnboardingIn(name="A", goal="vacation", targetBand=6.5)


def test_program_rejects_bad_length():
    with pytest.raises(ValidationError):
        ProgramIn(lengthDays=45)


def test_onboarding_rejects_out_of_range_band():
    with pytest.raises(ValidationError):
        OnboardingIn(name="A", goal="work", targetBand=12)


def test_program_accepts_90():
    assert ProgramIn(lengthDays=90).length_days == 90
