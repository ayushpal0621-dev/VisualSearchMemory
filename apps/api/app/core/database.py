from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from apps.api.app.core.config import settings
from apps.api.app.core.logging import logger

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        echo=False,
        future=True,
    )
except Exception as e:
    logger.error(f"Failed to initialize engine with {settings.DATABASE_URL}: {e}. Falling back to SQLite.")
    fallback_url = f"sqlite:///{settings.STORAGE_PATH}/fallback.db"
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Import all models before creating tables
    import apps.api.app.models.image
    import apps.api.app.models.collection
    import apps.api.app.models.history
    import apps.api.app.models.job
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully.")
