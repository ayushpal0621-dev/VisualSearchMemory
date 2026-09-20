from typing import List, Dict, Any
from sqlalchemy.orm import Session
import imagehash
from apps.api.app.models.image import Image
from apps.api.app.schemas.stats import DuplicateGroupResponse

class DuplicateService:
    """Detects exact duplicate files (SHA-256) and near-duplicate images (pHash)."""

    @staticmethod
    def find_duplicates(db: Session) -> List[DuplicateGroupResponse]:
        images = db.query(Image).filter(Image.status == "completed").all()
        if not images:
            return []

        results: List[DuplicateGroupResponse] = []

        # 1. Exact duplicates by SHA-256 hash
        hash_groups: Dict[str, List[Image]] = {}
        for img in images:
            if img.file_hash:
                hash_groups.setdefault(img.file_hash, []).append(img)

        exact_duplicate_ids = set()
        for fhash, group in hash_groups.items():
            if len(group) > 1:
                for img in group:
                    exact_duplicate_ids.add(img.id)
                results.append(DuplicateGroupResponse(
                    type="exact",
                    hash_value=fhash,
                    similarity_score=1.0,
                    images=[
                        {
                            "id": img.id,
                            "filename": img.filename,
                            "original_name": img.original_name,
                            "file_size": img.file_size,
                            "created_at": img.created_at.isoformat()
                        }
                        for img in group
                    ]
                ))

        # 2. Near duplicates by pHash Hamming distance <= 6 among non-exact duplicates
        remaining_images = [img for img in images if img.phash and img.id not in exact_duplicate_ids]
        visited = set()

        for i in range(len(remaining_images)):
            img_a = remaining_images[i]
            if img_a.id in visited:
                continue

            try:
                hash_a = imagehash.hex_to_hash(img_a.phash)
            except Exception:
                continue

            cluster = [img_a]
            min_dist = 64

            for j in range(i + 1, len(remaining_images)):
                img_b = remaining_images[j]
                if img_b.id in visited:
                    continue

                try:
                    hash_b = imagehash.hex_to_hash(img_b.phash)
                    dist = hash_a - hash_b
                    # Hamming distance <= 6 out of 64 bits denotes strong near-duplicate visual similarity
                    if dist <= 6:
                        cluster.append(img_b)
                        visited.add(img_b.id)
                        if dist < min_dist:
                            min_dist = dist
                except Exception:
                    continue

            if len(cluster) > 1:
                visited.add(img_a.id)
                similarity_pct = round(max(0.0, 1.0 - (min_dist / 64.0)), 2)
                results.append(DuplicateGroupResponse(
                    type="near",
                    hash_value=img_a.phash,
                    similarity_score=similarity_pct,
                    images=[
                        {
                            "id": img.id,
                            "filename": img.filename,
                            "original_name": img.original_name,
                            "file_size": img.file_size,
                            "created_at": img.created_at.isoformat()
                        }
                        for img in cluster
                    ]
                ))

        return results

duplicate_service = DuplicateService()
