from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.models.collection import Collection, CollectionImage
from apps.api.app.schemas.collection import (
    CollectionCreate, CollectionUpdate, CollectionResponse, CollectionAddImages
)

router = APIRouter(prefix="/collections", tags=["collections"])

@router.get("", response_model=List[CollectionResponse])
def list_collections(db: Session = Depends(get_db)):
    collections = db.query(Collection).all()
    results = []
    for col in collections:
        img_count = len(col.images)
        cover_id = col.images[0].image_id if col.images else None
        results.append(CollectionResponse(
            id=col.id,
            name=col.name,
            description=col.description,
            color=col.color,
            image_count=img_count,
            cover_image_id=cover_id,
            created_at=col.created_at,
            updated_at=col.updated_at
        ))
    return results

@router.post("", response_model=CollectionResponse)
def create_collection(req: CollectionCreate, db: Session = Depends(get_db)):
    existing = db.query(Collection).filter(Collection.name == req.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Collection with this name already exists.")

    col = Collection(
        name=req.name,
        description=req.description,
        color=req.color or "#3b82f6"
    )
    db.add(col)
    db.commit()
    db.refresh(col)
    return CollectionResponse(
        id=col.id,
        name=col.name,
        description=col.description,
        color=col.color,
        image_count=0,
        cover_image_id=None,
        created_at=col.created_at,
        updated_at=col.updated_at
    )

@router.patch("/{collection_id}", response_model=CollectionResponse)
def update_collection(collection_id: str, req: CollectionUpdate, db: Session = Depends(get_db)):
    col = db.query(Collection).filter(Collection.id == collection_id).first()
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found.")

    if req.name is not None:
        col.name = req.name
    if req.description is not None:
        col.description = req.description
    if req.color is not None:
        col.color = req.color

    db.commit()
    db.refresh(col)
    img_count = len(col.images)
    cover_id = col.images[0].image_id if col.images else None
    return CollectionResponse(
        id=col.id,
        name=col.name,
        description=col.description,
        color=col.color,
        image_count=img_count,
        cover_image_id=cover_id,
        created_at=col.created_at,
        updated_at=col.updated_at
    )

@router.delete("/{collection_id}")
def delete_collection(collection_id: str, db: Session = Depends(get_db)):
    col = db.query(Collection).filter(Collection.id == collection_id).first()
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found.")

    db.delete(col)
    db.commit()
    return {"message": "Collection deleted successfully", "id": collection_id}

@router.post("/{collection_id}/images")
def add_images_to_collection(
    collection_id: str,
    req: CollectionAddImages,
    db: Session = Depends(get_db)
):
    col = db.query(Collection).filter(Collection.id == collection_id).first()
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found.")

    existing_img_ids = {ci.image_id for ci in col.images}
    added = 0
    for img_id in req.image_ids:
        if img_id not in existing_img_ids:
            ci = CollectionImage(collection_id=collection_id, image_id=img_id)
            db.add(ci)
            added += 1

    db.commit()
    return {"message": f"Added {added} images to collection", "collection_id": collection_id}

@router.delete("/{collection_id}/images/{image_id}")
def remove_image_from_collection(
    collection_id: str,
    image_id: str,
    db: Session = Depends(get_db)
):
    ci = db.query(CollectionImage).filter(
        CollectionImage.collection_id == collection_id,
        CollectionImage.image_id == image_id
    ).first()
    if not ci:
        raise HTTPException(status_code=404, detail="Image not found in collection.")

    db.delete(ci)
    db.commit()
    return {"message": "Image removed from collection", "collection_id": collection_id, "image_id": image_id}
