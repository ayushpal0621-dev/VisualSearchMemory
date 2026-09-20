from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from apps.api.app.core.database import get_db
from apps.api.app.models.image import Image, OCRResult
from apps.api.app.models.collection import Collection
from apps.api.app.models.history import SearchHistory
from apps.api.app.schemas.stats import (
    SystemStatsResponse, DuplicateGroupResponse, ClusterGroupResponse
)
from apps.api.app.services.duplicate_service import duplicate_service
from ml.clustering import get_clustering_service
from ml.retrieval import get_vector_retriever

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("", response_model=SystemStatsResponse)
def get_system_stats(db: Session = Depends(get_db)):
    """Retrieve operational dashboard statistics."""
    total = db.query(Image).count()
    indexed = db.query(Image).filter(Image.status == "completed").count()
    failed = db.query(Image).filter(Image.status == "failed").count()
    pending = db.query(Image).filter(Image.status.in_(["pending", "processing"])).count()
    collections_count = db.query(Collection).count()

    # Storage size
    total_bytes = db.query(func.sum(Image.file_size)).scalar() or 0

    # OCR coverage
    ocr_count = db.query(OCRResult).filter(OCRResult.word_count > 0).count()
    coverage_pct = round((ocr_count / indexed * 100), 1) if indexed > 0 else 0.0

    # Recent searches
    recent_searches = db.query(SearchHistory).order_by(SearchHistory.created_at.desc()).limit(5).all()
    searches_data = [
        {
            "query": s.query,
            "mode": s.search_mode,
            "results": s.result_count,
            "latency_ms": s.latency_ms,
            "time": s.created_at.isoformat()
        }
        for s in recent_searches
    ]

    # Recently indexed
    recently_indexed = db.query(Image).filter(Image.status == "completed").order_by(Image.created_at.desc()).limit(6).all()
    indexed_data = [
        {
            "id": img.id,
            "filename": img.filename,
            "original_name": img.original_name,
            "mime_type": img.mime_type,
            "created_at": img.created_at.isoformat()
        }
        for img in recently_indexed
    ]

    return SystemStatsResponse(
        total_images=total,
        indexed_images=indexed,
        failed_images=failed,
        pending_images=pending,
        collections_count=collections_count,
        storage_used_bytes=total_bytes,
        storage_used_mb=round(total_bytes / (1024 * 1024), 2),
        ocr_coverage_percentage=coverage_pct,
        recent_searches=searches_data,
        recently_indexed=indexed_data
    )

@router.get("/duplicates", response_model=List[DuplicateGroupResponse])
def get_duplicates(db: Session = Depends(get_db)):
    """Detect and return exact and near-duplicate image groups."""
    return duplicate_service.find_duplicates(db)

@router.get("/clusters", response_model=List[ClusterGroupResponse])
def get_clusters(db: Session = Depends(get_db)):
    """Retrieve pre-computed image clusters."""
    # Run clustering on demand if not cached
    return run_clusters_job(db=db, n_clusters=4, algorithm="kmeans")

@router.post("/clusters/run", response_model=List[ClusterGroupResponse])
def run_clusters_job(
    db: Session = Depends(get_db),
    n_clusters: int = Query(5, ge=2, le=20),
    algorithm: str = Query("kmeans", regex="^(kmeans|dbscan)$")
):
    """Compute vector clusters and derive semantic labels from OCR/metadata."""
    images = db.query(Image).filter(Image.status == "completed").all()
    if len(images) < 2:
        return []

    vector_retriever = get_vector_retriever()
    images_data = []

    for img in images:
        vec = vector_retriever.get_vector(img.id)
        if vec:
            ocr_text = img.ocr_result.text if img.ocr_result else ""
            images_data.append({
                "image_id": img.id,
                "vector": vec,
                "filename": img.original_name,
                "ocr_text": ocr_text
            })

    if len(images_data) < 2:
        return []

    clustering_service = get_clustering_service()
    cluster_results = clustering_service.run_clustering(
        images_data=images_data,
        algorithm=algorithm,
        n_clusters=n_clusters
    )

    # Persist cluster_id in DB
    for c in cluster_results:
        cid = c["cluster_id"]
        for iid in c["image_ids"]:
            img_obj = db.query(Image).filter(Image.id == iid).first()
            if img_obj:
                img_obj.cluster_id = cid
    db.commit()

    return [
        ClusterGroupResponse(
            cluster_id=c["cluster_id"],
            label=c["label"],
            image_count=c["image_count"],
            top_keywords=c["top_keywords"],
            sample_images=c["sample_images"]
        )
        for c in cluster_results
    ]
