from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class IndexingJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source_type: str
    total_images: int
    processed_images: int
    failed_images: int
    status: str
    error_summary: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
