from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from apps.api.app.schemas.image import ImageResponse

class SearchFilters(BaseModel):
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    mime_types: Optional[List[str]] = None
    collection_id: Optional[str] = None
    has_ocr: Optional[bool] = None
    similarity_threshold: Optional[float] = Field(default=0.0, ge=0.0, le=1.0)
    cluster_id: Optional[int] = None

class SearchWeights(BaseModel):
    semantic: float = Field(default=0.6, ge=0.0, le=1.0)
    keyword: float = Field(default=0.3, ge=0.0, le=1.0)
    metadata: float = Field(default=0.1, ge=0.0, le=1.0)

class SearchRequest(BaseModel):
    query: str
    search_mode: str = Field(default="hybrid", description="semantic, ocr, hybrid")
    enable_reranking: bool = Field(default=True, description="Enable secondary heuristic and signal re-ranking")
    filters: Optional[SearchFilters] = None
    weights: Optional[SearchWeights] = None
    limit: int = Field(default=24, ge=1, le=100)
    offset: int = Field(default=0, ge=0)

class SimilarImageRequest(BaseModel):
    image_id: str
    limit: int = Field(default=12, ge=1, le=50)
    similarity_threshold: float = Field(default=0.5, ge=0.0, le=1.0)

class RetrievalSignals(BaseModel):
    semantic_score: float = 0.0
    keyword_score: float = 0.0
    metadata_score: float = 0.0
    final_score: float = 0.0
    matched_terms: List[str] = []
    explanation_reasons: List[str] = []

class SearchResultItem(BaseModel):
    image: ImageResponse
    score: float
    signals: RetrievalSignals

class SearchResponse(BaseModel):
    query: str
    search_mode: str
    total_found: int
    latency_ms: float
    results: List[SearchResultItem]
    query_understanding: Optional[Dict[str, Any]] = None

class ConversationMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str

class ConversationSearchRequest(BaseModel):
    messages: List[ConversationMessage]
    current_query: str
    filters: Optional[SearchFilters] = None
    limit: int = Field(default=24, ge=1, le=100)

class ConversationSearchResponse(BaseModel):
    assistant_reply: str
    interpreted_query: str
    interpreted_filters: Dict[str, Any]
    search_response: SearchResponse
