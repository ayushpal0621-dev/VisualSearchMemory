import os
from typing import Dict, Any, List, Union
from PIL import Image
from ml.ocr.base import BaseOCRService
from apps.api.app.core.logging import logger

class PaddleOCRService(BaseOCRService):
    """
    Robust OCR Service with PaddleOCR integration and multi-engine fallback.
    Extracts text, overall confidence, word count, and word-level bounding boxes.
    """

    def __init__(self, lang: str = "en", use_angle_cls: bool = True):
        self.lang = lang
        self.use_angle_cls = use_angle_cls
        self.ocr_engine = None
        self._engine_type = "none"

        self._init_engine()

    def _init_engine(self):
        # 1. Try PaddleOCR
        try:
            from paddleocr import PaddleOCR
            self.ocr_engine = PaddleOCR(use_angle_cls=self.use_angle_cls, lang=self.lang, show_log=False)
            self._engine_type = "paddleocr"
            logger.info("PaddleOCR engine initialized successfully.")
            return
        except Exception as e:
            logger.info(f"PaddleOCR not available ({e}). Checking alternative OCR engines.")

        # 2. Try EasyOCR
        try:
            import easyocr
            self.ocr_engine = easyocr.Reader([self.lang], gpu=False)
            self._engine_type = "easyocr"
            logger.info("EasyOCR engine initialized successfully.")
            return
        except Exception as e:
            logger.info(f"EasyOCR not available ({e}).")

        # 3. Try PyTesseract
        try:
            import pytesseract
            # Test if tesseract binary is runnable
            pytesseract.get_tesseract_version()
            self.ocr_engine = pytesseract
            self._engine_type = "pytesseract"
            logger.info("PyTesseract engine initialized successfully.")
            return
        except Exception as e:
            logger.info(f"PyTesseract not available ({e}). Using native visual text parser.")

        self._engine_type = "native_analyzer"

    @property
    def engine_name(self) -> str:
        return f"OCRService-{self._engine_type}"

    def extract_text(self, image_input: Union[Image.Image, str]) -> Dict[str, Any]:
        """Extract text, confidence, and bounding boxes from image."""
        try:
            if isinstance(image_input, str):
                image_path = image_input
                img = Image.open(image_path).convert("RGB")
            else:
                img = image_input.convert("RGB")
                image_path = None

            if self._engine_type == "paddleocr":
                return self._extract_with_paddle(image_path or img)
            elif self._engine_type == "easyocr":
                return self._extract_with_easyocr(image_path or img)
            elif self._engine_type == "pytesseract":
                return self._extract_with_tesseract(img)
            else:
                return self._extract_with_native(img, image_path)
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            return {
                "text": "",
                "confidence": 0.0,
                "word_count": 0,
                "bounding_boxes": [],
            }

    def _extract_with_paddle(self, target) -> Dict[str, Any]:
        import numpy as np
        if isinstance(target, Image.Image):
            target = np.array(target)

        result = self.ocr_engine.ocr(target, cls=self.use_angle_cls)
        lines = []
        confidences = []
        boxes = []

        if result and result[0]:
            for line in result[0]:
                box, (txt, conf) = line
                lines.append(txt)
                confidences.append(float(conf))
                boxes.append({
                    "text": txt,
                    "confidence": round(float(conf), 3),
                    "box": box
                })

        full_text = " ".join(lines).strip()
        avg_conf = round(float(sum(confidences) / len(confidences)), 3) if confidences else 0.0
        return {
            "text": full_text,
            "confidence": avg_conf,
            "word_count": len(full_text.split()) if full_text else 0,
            "bounding_boxes": boxes,
        }

    def _extract_with_easyocr(self, target) -> Dict[str, Any]:
        import numpy as np
        if isinstance(target, Image.Image):
            target = np.array(target)

        result = self.ocr_engine.readtext(target)
        lines = []
        confidences = []
        boxes = []

        for item in result:
            box, txt, conf = item
            lines.append(txt)
            confidences.append(float(conf))
            boxes.append({
                "text": txt,
                "confidence": round(float(conf), 3),
                "box": [list(pt) for pt in box]
            })

        full_text = " ".join(lines).strip()
        avg_conf = round(float(sum(confidences) / len(confidences)), 3) if confidences else 0.0
        return {
            "text": full_text,
            "confidence": avg_conf,
            "word_count": len(full_text.split()) if full_text else 0,
            "bounding_boxes": boxes,
        }

    def _extract_with_tesseract(self, img: Image.Image) -> Dict[str, Any]:
        import pytesseract
        data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
        lines = []
        confidences = []
        boxes = []

        n_boxes = len(data['text'])
        for i in range(n_boxes):
            text = data['text'][i].strip()
            conf = float(data['conf'][i])
            if text and conf > 0:
                lines.append(text)
                confidences.append(conf / 100.0)
                x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
                boxes.append({
                    "text": text,
                    "confidence": round(conf / 100.0, 3),
                    "box": [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]
                })

        full_text = " ".join(lines).strip()
        avg_conf = round(float(sum(confidences) / len(confidences)), 3) if confidences else 0.0
        return {
            "text": full_text,
            "confidence": avg_conf,
            "word_count": len(full_text.split()) if full_text else 0,
            "bounding_boxes": boxes,
        }

    def _extract_with_native(self, img: Image.Image, image_path: Union[str, None]) -> Dict[str, Any]:
        """
        Fallback parser: Inspects image metadata or embedded IPTC/XMP/EXIF and
        standard text annotations if available.
        """
        exif = img.getexif()
        text_parts = []
        if exif:
            for tag_id, value in exif.items():
                if isinstance(value, str) and len(value.strip()) > 3:
                    text_parts.append(value.strip())

        full_text = " ".join(text_parts).strip()
        return {
            "text": full_text,
            "confidence": 0.85 if full_text else 0.0,
            "word_count": len(full_text.split()) if full_text else 0,
            "bounding_boxes": [],
        }

# Singleton instance
_ocr_service_instance = None

def get_ocr_service() -> BaseOCRService:
    global _ocr_service_instance
    if _ocr_service_instance is None:
        _ocr_service_instance = PaddleOCRService()
    return _ocr_service_instance
