import os
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.core.config import settings
from apps.api.app.models.image import Image
from apps.api.app.models.collection import CollectionImage
from apps.api.app.schemas.image import ImageResponse, ImageListResponse, ImageMetadataResponse, OCRResultResponse
from apps.api.app.schemas.job import IndexingJobResponse
from apps.api.app.services.image_service import image_service
from apps.api.app.services.indexing_pipeline import indexing_pipeline
from apps.api.app.services.job_service import job_service
from ml.retrieval import get_vector_retriever
from apps.api.app.core.logging import logger

router = APIRouter(prefix="/images", tags=["images"])

@router.post("/upload", response_model=IndexingJobResponse)
async def upload_images(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """Upload one or multiple images and trigger background multimodal indexing."""
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    saved_images = []
    for file in files:
        content = await file.read()
        is_valid, err = image_service.validate_file(file.filename, len(content))
        if not is_valid:
            logger.warning(f"File {file.filename} rejected: {err}")
            continue

        file_meta = image_service.save_uploaded_file(content, file.filename)

        img = Image(
            id=file_meta["id"],
            filename=file_meta["filename"],
            original_name=file_meta["original_name"],
            file_path=file_meta["file_path"],
            mime_type=file_meta["mime_type"],
            file_size=file_meta["file_size"],
            width=file_meta["width"],
            height=file_meta["height"],
            file_hash=file_meta["file_hash"],
            phash=file_meta["phash"],
            status="pending"
        )
        db.add(img)
        saved_images.append(img.id)

    db.commit()

    # Create background job
    job = job_service.create_job(db, source_type="upload", total=len(saved_images))
    background_tasks.add_task(indexing_pipeline.index_batch_async, saved_images, job.id)

    return job

@router.post("/import-directory", response_model=IndexingJobResponse)
def import_directory(
    background_tasks: BackgroundTasks,
    directory_path: str = Form(...),
    db: Session = Depends(get_db)
):
    """Import an entire local directory of images into visual memory."""
    target_dir = Path(directory_path).resolve()
    if not target_dir.exists() or not target_dir.is_dir():
        raise HTTPException(status_code=400, detail=f"Directory does not exist: {directory_path}")

    image_extensions = {f".{ext}" for ext in settings.ALLOWED_EXTENSIONS}
    image_paths = [p for p in target_dir.rglob("*") if p.is_file() and p.suffix.lower() in image_extensions]

    if not image_paths:
        raise HTTPException(status_code=400, detail=f"No supported images found in {directory_path}")

    saved_ids = []
    skipped_duplicates = 0
    for p in image_paths:
        try:
            with open(p, "rb") as f:
                content = f.read()

            import hashlib
            file_hash = hashlib.sha256(content).hexdigest()
            existing = db.query(Image).filter(Image.file_hash == file_hash, Image.status == "completed").first()
            if existing:
                logger.info(f"Skipping duplicate image during folder import: {p.name} matches existing image {existing.id}")
                skipped_duplicates += 1
                continue

            file_meta = image_service.save_uploaded_file(content, p.name)
            img = Image(
                id=file_meta["id"],
                filename=file_meta["filename"],
                original_name=file_meta["original_name"],
                file_path=file_meta["file_path"],
                mime_type=file_meta["mime_type"],
                file_size=file_meta["file_size"],
                width=file_meta["width"],
                height=file_meta["height"],
                file_hash=file_meta["file_hash"],
                phash=file_meta["phash"],
                status="pending"
            )
            db.add(img)
            saved_ids.append(img.id)
        except Exception as e:
            logger.error(f"Failed importing {p}: {e}")

    db.commit()

    job = job_service.create_job(db, source_type="directory", total=len(saved_ids))
    if saved_ids:
        background_tasks.add_task(indexing_pipeline.index_batch_async, saved_ids, job.id)
    else:
        # All files were identical duplicates and skipped
        job.status = "completed"
        job.progress = 1.0
        job.processed_images = 0
        job.total_images = skipped_duplicates
        db.commit()

    return job

@router.post("/index", response_model=IndexingJobResponse)
def reindex_all(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Re-index any pending or failed images."""
    pending_images = db.query(Image).filter(Image.status.in_(["pending", "failed"])).all()
    img_ids = [img.id for img in pending_images]

    job = job_service.create_job(db, source_type="batch_reindex", total=len(img_ids))
    if img_ids:
        background_tasks.add_task(indexing_pipeline.index_batch_async, img_ids, job.id)
    return job

@router.get("", response_model=ImageListResponse)
def list_images(
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
    status: Optional[str] = None,
    collection_id: Optional[str] = None,
    cluster_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """List images with pagination, status filtering, and collection filtering."""
    query = db.query(Image)
    if status:
        query = query.filter(Image.status == status)
    if cluster_id is not None:
        query = query.filter(Image.cluster_id == cluster_id)
    if collection_id:
        query = query.join(CollectionImage).filter(CollectionImage.collection_id == collection_id)

    total = query.count()
    images = query.order_by(Image.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for img in images:
        col_names = [ci.collection.name for ci in img.collection_items if ci.collection]
        items.append(ImageResponse(
            id=img.id,
            filename=img.filename,
            original_name=img.original_name,
            mime_type=img.mime_type,
            file_size=img.file_size,
            width=img.width,
            height=img.height,
            file_hash=img.file_hash,
            phash=img.phash,
            status=img.status,
            error_message=img.error_message,
            cluster_id=img.cluster_id,
            created_at=img.created_at,
            updated_at=img.updated_at,
            metadata=ImageMetadataResponse.model_validate(img.metadata_rel) if img.metadata_rel else None,
            ocr=OCRResultResponse.model_validate(img.ocr_result) if img.ocr_result else None,
            collections=col_names
        ))

    return ImageListResponse(total=total, page=page, page_size=page_size, items=items)

@router.get("/{image_id}", response_model=ImageResponse)
def get_image(image_id: str, db: Session = Depends(get_db)):
    """Retrieve complete metadata and OCR text for a single image."""
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found.")

    col_names = [ci.collection.name for ci in img.collection_items if ci.collection]
    return ImageResponse(
        id=img.id,
        filename=img.filename,
        original_name=img.original_name,
        mime_type=img.mime_type,
        file_size=img.file_size,
        width=img.width,
        height=img.height,
        file_hash=img.file_hash,
        phash=img.phash,
        status=img.status,
        error_message=img.error_message,
        cluster_id=img.cluster_id,
        created_at=img.created_at,
        updated_at=img.updated_at,
        metadata=ImageMetadataResponse.model_validate(img.metadata_rel) if img.metadata_rel else None,
        ocr=OCRResultResponse.model_validate(img.ocr_result) if img.ocr_result else None,
        collections=col_names
    )

@router.get("/{image_id}/file")
def get_image_file(image_id: str, db: Session = Depends(get_db)):
    """Stream raw image file for frontend thumbnail / high-res rendering."""
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img or not os.path.exists(img.file_path):
        raise HTTPException(status_code=404, detail="Image file not found on disk.")
    return FileResponse(img.file_path, media_type=img.mime_type)

@router.delete("/{image_id}")
def delete_image(
    image_id: str,
    delete_source: bool = Query(False, description="Delete file from disk storage"),
    db: Session = Depends(get_db)
):
    """Delete an image from database, vector index, and optionally disk."""
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found.")

    # Remove from Qdrant vector index
    try:
        vector_retriever = get_vector_retriever()
        vector_retriever.delete_vector(image_id)
    except Exception as e:
        logger.error(f"Error removing vector {image_id}: {e}")

    # Remove from disk if requested
    if delete_source and img.file_path:
        image_service.delete_file(img.file_path)

    db.delete(img)
    db.commit()
    return {"message": "Image deleted successfully", "id": image_id}
