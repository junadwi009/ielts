from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

_engine = None
_Session = None

def make_engine(url):
    return create_engine(url, pool_pre_ping=True)

def init_engine(url):
    global _engine, _Session
    _engine = make_engine(url)
    _Session = sessionmaker(bind=_engine)
    return _engine

@contextmanager
def get_session():
    s = _Session()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()
