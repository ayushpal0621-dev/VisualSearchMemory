from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class ImageMetadataResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date_taken: Optional[datetime] = None
    camera_make: Optional[str] = None
    camera_model: Optional[str] = None
    embedding_model: Optional[str] = None
    embedding_version: Optional[str] = None
    color_palette: Optional[List[str]] = None
    processing_time_ms: Optional[float] = None

class OCRResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    text: str = ""
    confidence: Optional[float] = None
    word_count: int = 0
    bounding_boxes: Optional[List[Dict[str, Any]]] = None

class ImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    original_name: str
    mime_type: str
    file_size: int
    width: Optional[int] = None
    height: Optional[int] = None
    file_hash: Optional[str] = None
    phash: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    cluster_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    metadata: Optional[ImageMetadataResponse] = None
    ocr: Optional[OCRResultResponse] = None
    collections: Optional[List[str]] = None

class ImageListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[ImageResponse]
