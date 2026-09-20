from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.schemas.search import (
    SearchRequest, SearchResponse, SimilarImageRequest,
    ConversationSearchRequest, ConversationSearchResponse
)
from apps.api.app.services.search_service import search_service
from apps.api.app.services.conversation_service import conversation_service

router = APIRouter(prefix="/search", tags=["search"])

@router.post("", response_model=SearchResponse)
async def perform_search(
    req: SearchRequest,
    db: Session = Depends(get_db)
):
    """
    Multimodal search across images:
    - semantic: Visual & conceptual match using OpenCLIP embeddings
    - ocr: Exact text keyword search extracted from diagrams/notes/screenshots
    - hybrid: Candidate fusion combining Vector + BM25 + Metadata signals
    """
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")
    return await search_service.search(db, req)

@router.post("/similar", response_model=SearchResponse)
def search_similar_image(
    req: SimilarImageRequest,
    db: Session = Depends(get_db)
):
    """Find visually and conceptually similar images based on an image ID."""
    return search_service.find_similar(db, req)

@router.post("/conversation", response_model=ConversationSearchResponse)
async def conversational_search(
    req: ConversationSearchRequest,
    db: Session = Depends(get_db)
):
    """
    Conversational search interface maintaining context across dialogue turns:
    e.g., 'Show AWS images' -> 'Only screenshots' -> 'From 2025'
    """
    return await conversation_service.converse_and_search(db, req)
