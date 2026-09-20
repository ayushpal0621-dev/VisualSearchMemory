from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.models.image import Image
from apps.api.app.schemas.stats import TimelineItemResponse

router = APIRouter(prefix="/timeline", tags=["timeline"])

@router.get("", response_model=List[TimelineItemResponse])
def get_timeline(db: Session = Depends(get_db)):
    """Retrieve visual memory grouped chronologically by day/month/year."""
    images = db.query(Image).filter(Image.status == "completed").order_by(Image.created_at.desc()).all()

    groups: Dict[str, Dict[str, Any]] = {}
    for img in images:
        date_str = img.created_at.strftime("%Y-%m-%d")
        if date_str not in groups:
            groups[date_str] = {
                "date": date_str,
                "year": img.created_at.year,
                "month": img.created_at.month,
                "day": img.created_at.day,
                "image_count": 0,
                "sample_images": []
            }

        groups[date_str]["image_count"] += 1
        if len(groups[date_str]["sample_images"]) < 4:
            groups[date_str]["sample_images"].append({
                "id": img.id,
                "filename": img.filename,
                "original_name": img.original_name,
                "mime_type": img.mime_type
            })

    return [TimelineItemResponse(**data) for date_str, data in groups.items()]
