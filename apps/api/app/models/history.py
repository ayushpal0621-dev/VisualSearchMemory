import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON
from apps.api.app.core.database import Base

class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    query = Column(String(512), nullable=False)
    search_mode = Column(String(32), default="hybrid")
    filters = Column(JSON, nullable=True)
    result_count = Column(Integer, default=0)
    latency_ms = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
