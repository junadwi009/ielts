from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.data.models import Base, PlacementCombo, GeneratedSet, PlacementItem
from app.data.seed import seed_all


def make_factory():
    eng = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(eng)
    return sessionmaker(bind=eng)


def test_seed_counts():
    Session = make_factory()
    seed_all(Session)
    with Session() as s:
        assert s.query(PlacementCombo).count() == 2
        assert s.query(GeneratedSet).count() == 20      # 4 skills x 5 sets
        # combo 1 has the right number of gradable items (10 listening + 13 reading)
        assert s.query(PlacementItem).filter_by(combo_id=1).count() == 23


def test_seed_idempotent():
    Session = make_factory()
    seed_all(Session)
    seed_all(Session)
    with Session() as s:
        assert s.query(PlacementCombo).count() == 2


def test_load_fixture_tips():
    from app.data.seed import load_fixture
    t = load_fixture("tips")
    assert "reading" in t and t["reading"]["bullets"]
