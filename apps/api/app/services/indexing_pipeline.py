import time
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from apps.api.app.models.image import Image, ImageMetadata, OCRResult
from apps.api.app.services.image_service import image_service
from apps.api.app.services.job_service import job_service
from ml.embeddings import get_embedding_service
from ml.ocr import get_ocr_service
from ml.retrieval import get_vector_retriever, get_bm25_retriever
from apps.api.app.core.logging import logger
from apps.api.app.core.database import SessionLocal

class IndexingPipeline:
    """End-to-end multimodal image indexing pipeline."""

    def __init__(self):
        self.embedding_service = get_embedding_service()
        self.ocr_service = get_ocr_service()
        self.vector_retriever = get_vector_retriever()
        self.bm25_retriever = get_bm25_retriever()

    def index_image_sync(self, db: Session, image_id: str, job_id: Optional[str] = None) -> bool:
        """Process a single image synchronously through the indexing pipeline."""
        start_time = time.perf_counter()
        image = db.query(Image).filter(Image.id == image_id).first()
        if not image:
            logger.error(f"Image {image_id} not found for indexing.")
            return False

        try:
            image.status = "processing"
            db.commit()

            # 1. Extract EXIF & Colors
            exif_meta = image_service.extract_exif(image.file_path)

            # 2. Run OCR
            ocr_data = self.ocr_service.extract_text(image.file_path)
            extracted_text = ocr_data.get("text", "")
            ocr_conf = ocr_data.get("confidence", 0.0)
            word_count = ocr_data.get("word_count", 0)
            boxes = ocr_data.get("bounding_boxes", [])

            # 3. Generate Visual Embedding
            vector = self.embedding_service.embed_image(image.file_path)

            # 4. Upsert or create Database Metadata & OCR Records
            proc_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

            if not image.metadata_rel:
                meta = ImageMetadata(
                    image_id=image.id,
                    date_taken=exif_meta.get("date_taken"),
                    camera_make=exif_meta.get("camera_make"),
                    camera_model=exif_meta.get("camera_model"),
                    embedding_model=self.embedding_service.model_name,
                    embedding_version="1.0",
                    color_palette=exif_meta.get("color_palette"),
                    raw_exif=exif_meta.get("raw_exif"),
                    processing_time_ms=proc_time_ms
                )
                db.add(meta)
            else:
                image.metadata_rel.date_taken = exif_meta.get("date_taken")
                image.metadata_rel.camera_make = exif_meta.get("camera_make")
                image.metadata_rel.camera_model = exif_meta.get("camera_model")
                image.metadata_rel.color_palette = exif_meta.get("color_palette")
                image.metadata_rel.processing_time_ms = proc_time_ms

            if not image.ocr_result:
                ocr = OCRResult(
                    image_id=image.id,
                    text=extracted_text,
                    confidence=ocr_conf,
                    word_count=word_count,
                    bounding_boxes=boxes
                )
                db.add(ocr)
            else:
                image.ocr_result.text = extracted_text
                image.ocr_result.confidence = ocr_conf
                image.ocr_result.word_count = word_count
                image.ocr_result.bounding_boxes = boxes

            # 5. Upsert to Qdrant
            payload = {
                "image_id": image.id,
                "filename": image.filename,
                "original_name": image.original_name,
                "mime_type": image.mime_type,
                "file_size": image.file_size,
                "width": image.width,
                "height": image.height,
                "cluster_id": image.cluster_id,
                "created_timestamp": int(image.created_at.timestamp()),
                "has_ocr": bool(extracted_text.strip()),
                "ocr_snippet": extracted_text[:200] if extracted_text else "",
                "phash": image.phash
            }
            self.vector_retriever.upsert_vector(
                image_id=image.id,
                vector=vector,
                payload=payload
            )

            # 6. Mark completed
            image.status = "completed"
            image.error_message = None
            db.commit()

            # 7. Update Job
            if job_id:
                job_service.update_progress(db, job_id, processed_inc=1, failed_inc=0)

            logger.info(f"Indexed image {image.id} ({image.original_name}) in {proc_time_ms}ms. OCR text length: {len(extracted_text)}")
            return True

        except Exception as e:
            logger.error(f"Failed to index image {image_id}: {e}", exc_info=True)
            db.rollback()
            image.status = "failed"
            image.error_message = str(e)
            try:
                db.commit()
            except Exception:
                pass

            if job_id:
                job_service.update_progress(db, job_id, processed_inc=0, failed_inc=1, error=str(e))
            return False

    def index_batch_async(self, image_ids: list, job_id: Optional[str] = None):
        """Worker function for asynchronous batch indexing."""
        db = SessionLocal()
        try:
            for img_id in image_ids:
                self.index_image_sync(db, img_id, job_id=job_id)
            # Rebuild BM25 index after batch
            self.refresh_bm25_index(db)
        finally:
            db.close()

    def refresh_bm25_index(self, db: Session):
        """Rebuild the in-memory BM25 index from all completed images."""
        try:
            images = db.query(Image).filter(Image.status == "completed").all()
            documents = []
            for img in images:
                ocr_text = img.ocr_result.text if img.ocr_result else ""
                documents.append({
                    "image_id": img.id,
                    "filename": img.original_name,
                    "text": ocr_text,
                    "tags": [img.mime_type]
                })
            self.bm25_retriever.build_index(documents)
        except Exception as e:
            logger.error(f"Error refreshing BM25 index: {e}")

indexing_pipeline = IndexingPipeline()
