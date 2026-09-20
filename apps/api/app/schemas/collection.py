from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#3b82f6"

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None

class CollectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None
    color: str
    image_count: int = 0
    cover_image_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class CollectionAddImages(BaseModel):
    image_ids: List[str]
