import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, JSON
from apps.api.app.core.database import Base

class IndexingJob(Base):
    __tablename__ = "indexing_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_type = Column(String(32), default="upload") # upload, directory, batch
    total_images = Column(Integer, default=0)
    processed_images = Column(Integer, default=0)
    failed_images = Column(Integer, default=0)
    status = Column(String(32), default="pending") # pending, running, completed, failed
    error_summary = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
