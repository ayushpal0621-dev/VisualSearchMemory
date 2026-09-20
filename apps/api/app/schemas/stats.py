from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class SystemStatsResponse(BaseModel):
    total_images: int
    indexed_images: int
    failed_images: int
    pending_images: int
    collections_count: int
    storage_used_bytes: int
    storage_used_mb: float
    ocr_coverage_percentage: float
    recent_searches: List[Dict[str, Any]]
    recently_indexed: List[Dict[str, Any]]

class TimelineItemResponse(BaseModel):
    date: str # "YYYY-MM-DD"
    year: int
    month: int
    day: int
    image_count: int
    sample_images: List[Dict[str, Any]]

class DuplicateGroupResponse(BaseModel):
    type: str # "exact" or "near"
    hash_value: str
    similarity_score: Optional[float] = None
    images: List[Dict[str, Any]]

class ClusterGroupResponse(BaseModel):
    cluster_id: int
    label: str
    image_count: int
    top_keywords: List[str]
    sample_images: List[Dict[str, Any]]
