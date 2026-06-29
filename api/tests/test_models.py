from sqlalchemy import create_engine
from app.data.models import Base, UserProfile, SkillLevel

def test_create_all_and_insert():
    eng = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(eng)
    from sqlalchemy.orm import Session
    with Session(eng) as s:
        u = UserProfile(name="Arjuna", goal="work", target_band=6.5, skill_targets={})
        s.add(u); s.commit()
        s.add(SkillLevel(user_id=u.id, skill="reading", band="C1"))
        s.commit()
        assert s.query(SkillLevel).count() == 1
