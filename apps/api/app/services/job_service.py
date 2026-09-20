from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from apps.api.app.models.job import IndexingJob
from apps.api.app.core.logging import logger

class JobService:
    """Manages indexing jobs and live progress tracking."""

    @staticmethod
    def create_job(db: Session, source_type: str = "upload", total: int = 0) -> IndexingJob:
        job = IndexingJob(
            source_type=source_type,
            total_images=total,
            processed_images=0,
            failed_images=0,
            status="running" if total > 0 else "completed",
            details={}
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def update_progress(db: Session, job_id: str, processed_inc: int = 1, failed_inc: int = 0, error: str = None):
        try:
            job = db.query(IndexingJob).filter(IndexingJob.id == job_id).first()
            if not job:
                return

            job.processed_images += processed_inc
            job.failed_images += failed_inc

            if error:
                job.error_summary = (job.error_summary or "") + f"\n{error}"

            if job.processed_images + job.failed_images >= job.total_images:
                job.status = "completed" if job.failed_images < job.total_images else "failed"

            db.commit()
        except Exception as e:
            logger.error(f"Error updating job progress for {job_id}: {e}")
            db.rollback()

    @staticmethod
    def get_job(db: Session, job_id: str) -> Optional[IndexingJob]:
        return db.query(IndexingJob).filter(IndexingJob.id == job_id).first()

job_service = JobService()
