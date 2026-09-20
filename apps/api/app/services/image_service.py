import os
import hashlib
import uuid
import shutil
from pathlib import Path
from typing import Tuple, Dict, Any, Optional, List
from datetime import datetime
from PIL import Image, ExifTags
import imagehash
from apps.api.app.core.config import settings
from apps.api.app.core.logging import logger

class ImageService:
    """Manages file storage, hash computation, and EXIF extraction."""

    def __init__(self):
        self.storage_path = Path(settings.STORAGE_PATH)
        self.storage_path.mkdir(parents=True, exist_ok=True)

    def validate_file(self, filename: str, file_size: int) -> Tuple[bool, Optional[str]]:
        """Validate file extension and size."""
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext not in settings.ALLOWED_EXTENSIONS:
            return False, f"Unsupported file type .{ext}. Allowed: {settings.ALLOWED_EXTENSIONS}"

        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            return False, f"File size exceeds maximum {settings.MAX_UPLOAD_SIZE_MB}MB limit."

        return True, None

    def save_uploaded_file(self, file_content: bytes, original_filename: str) -> Dict[str, Any]:
        """Save file bytes into the internal storage directory and compute hashes."""
        ext = original_filename.split(".")[-1].lower() if "." in original_filename else "jpg"
        internal_id = str(uuid.uuid4())
        safe_filename = f"{internal_id}.{ext}"
        destination_path = self.storage_path / safe_filename

        with open(destination_path, "wb") as f:
            f.write(file_content)

        file_hash = hashlib.sha256(file_content).hexdigest()

        # Compute image dimensions and perceptual hash
        width, height, phash_str = None, None, None
        try:
            with Image.open(destination_path) as img:
                width, height = img.size
                phash_val = imagehash.phash(img)
                phash_str = str(phash_val)
        except Exception as e:
            logger.error(f"Failed to read image properties for {safe_filename}: {e}")

        # Detect MIME
        mime_map = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "webp": "image/webp",
            "gif": "image/gif"
        }
        mime_type = mime_map.get(ext, "image/jpeg")

        return {
            "id": internal_id,
            "filename": safe_filename,
            "original_name": original_filename,
            "file_path": str(destination_path),
            "file_size": len(file_content),
            "mime_type": mime_type,
            "width": width,
            "height": height,
            "file_hash": file_hash,
            "phash": phash_str,
        }

    def extract_exif(self, image_path: str) -> Dict[str, Any]:
        """Extract EXIF metadata: date taken, camera make/model, etc."""
        metadata = {
            "date_taken": None,
            "camera_make": None,
            "camera_model": None,
            "raw_exif": {},
            "color_palette": []
        }
        try:
            with Image.open(image_path) as img:
                exif_data = img.getexif()
                if exif_data:
                    for tag_id, value in exif_data.items():
                        tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                        if tag_name == "DateTime" or tag_name == "DateTimeOriginal":
                            try:
                                metadata["date_taken"] = datetime.strptime(str(value), "%Y:%m:%d %H:%M:%S")
                            except Exception:
                                pass
                        elif tag_name == "Make":
                            metadata["camera_make"] = str(value).strip()
                        elif tag_name == "Model":
                            metadata["camera_model"] = str(value).strip()

                # Extract dominant palette colors (top 4 hex colors)
                small_img = img.resize((32, 32)).convert("RGB")
                colors = small_img.getcolors(32 * 32)
                if colors:
                    colors.sort(key=lambda x: x[0], reverse=True)
                    hex_colors = [f"#{r:02x}{g:02x}{b:02x}" for count, (r, g, b) in colors[:4]]
                    metadata["color_palette"] = hex_colors
        except Exception as e:
            logger.debug(f"Could not extract EXIF from {image_path}: {e}")

        return metadata

    def delete_file(self, file_path: str) -> bool:
        """Safely delete file from disk."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        except Exception as e:
            logger.error(f"Error deleting file {file_path}: {e}")
        return False

image_service = ImageService()
