from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.schemas.job import IndexingJobResponse
from apps.api.app.services.job_service import job_service

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("/{job_id}", response_model=IndexingJobResponse)
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    """Retrieve status and progress of an asynchronous indexing job."""
    job = job_service.get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job
