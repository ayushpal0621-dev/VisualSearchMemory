from abc import ABC, abstractmethod
from typing import Dict, Any, List, Union
from PIL import Image

class BaseOCRService(ABC):
    """Abstract interface for OCR extraction."""

    @abstractmethod
    def extract_text(self, image_input: Union[Image.Image, str]) -> Dict[str, Any]:
        """
        Extract text from an image.
        Returns:
            {
                "text": str,
                "confidence": float,
                "word_count": int,
                "bounding_boxes": List[Dict[str, Any]] # e.g. [{"text": ..., "box": [...], "confidence": ...}]
            }
        """
        pass

    @property
    @abstractmethod
    def engine_name(self) -> str:
        pass
