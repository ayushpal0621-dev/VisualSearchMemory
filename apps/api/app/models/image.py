import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from apps.api.app.core.database import Base

class Image(Base):
    __tablename__ = "images"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    mime_type = Column(String(64), nullable=False)
    file_size = Column(Integer, nullable=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    file_hash = Column(String(64), nullable=True, index=True)  # SHA-256 for exact duplicates
    phash = Column(String(64), nullable=True, index=True)      # Perceptual hash for near duplicates
    status = Column(String(32), default="pending", index=True) # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    cluster_id = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    metadata_rel = relationship("ImageMetadata", back_populates="image", uselist=False, cascade="all, delete-orphan")
    ocr_result = relationship("OCRResult", back_populates="image", uselist=False, cascade="all, delete-orphan")
    collection_items = relationship("CollectionImage", back_populates="image", cascade="all, delete-orphan")

class ImageMetadata(Base):
    __tablename__ = "image_metadata"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    image_id = Column(String(36), ForeignKey("images.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    date_taken = Column(DateTime, nullable=True, index=True)
    camera_make = Column(String(128), nullable=True)
    camera_model = Column(String(128), nullable=True)
    embedding_model = Column(String(128), nullable=True)
    embedding_version = Column(String(32), nullable=True)
    color_palette = Column(JSON, nullable=True)
    raw_exif = Column(JSON, nullable=True)
    processing_time_ms = Column(Float, nullable=True)

    image = relationship("Image", back_populates="metadata_rel")

class OCRResult(Base):
    __tablename__ = "ocr_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    image_id = Column(String(36), ForeignKey("images.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    text = Column(Text, nullable=False, default="")
    confidence = Column(Float, nullable=True)
    word_count = Column(Integer, default=0)
    bounding_boxes = Column(JSON, nullable=True) # list of {text, box, confidence}

    image = relationship("Image", back_populates="ocr_result")
