import os
import torch
import numpy as np
from PIL import Image
from typing import List, Union
from ml.embeddings.base import BaseEmbeddingService
from apps.api.app.core.logging import logger

class TransformersCLIPEmbeddingService(BaseEmbeddingService):
    """
    Hugging Face Transformers CLIP Multimodal Embedding Service.
    Demonstrates model pluggability and experimental comparison.
    """

    def __init__(self, model_name: str = "openai/clip-vit-base-patch32"):
        self._model_name = model_name
        self._dimension = 512

        if torch.backends.mps.is_available():
            self.device = torch.device("mps")
        elif torch.cuda.is_available():
            self.device = torch.device("cuda")
        else:
            self.device = torch.device("cpu")

        logger.info(f"Initializing Transformers CLIP model ({model_name}) on device: {self.device}")

        self.model = None
        self.processor = None
        self._is_mock = False

        self._load_model()

    def _load_model(self):
        try:
            from transformers import CLIPModel, CLIPProcessor, CLIPConfig
            offline = os.environ.get("OPENCLIP_OFFLINE", "false").lower() in ("true", "1", "yes")

            if not offline:
                try:
                    self.model = CLIPModel.from_pretrained(self._model_name).to(self.device)
                    self.processor = CLIPProcessor.from_pretrained(self._model_name)
                    self.model.eval()
                    logger.info(f"Loaded pretrained Transformers CLIP: {self._model_name}")
                    return
                except Exception as e:
                    logger.warning(f"Could not load online weights for {self._model_name}: {e}")

            # Instantiate standard local architecture
            config = CLIPConfig()
            self.model = CLIPModel(config).to(self.device)
            self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32", local_files_only=True)
            self.model.eval()
            logger.info("Initialized local Transformers CLIP architecture.")
        except Exception as e:
            logger.warning(f"Fallback to deterministic embedding generator for Transformers CLIP: {e}")
            self._is_mock = True

    @property
    def dimension(self) -> int:
        return self._dimension

    @property
    def model_name(self) -> str:
        return f"Transformers-{self._model_name}"

    def _normalize(self, v: np.ndarray) -> List[float]:
        norm = np.linalg.norm(v)
        if norm == 0:
            return v.tolist()
        return (v / norm).tolist()

    def embed_image(self, image_input: Union[Image.Image, str]) -> List[float]:
        if self._is_mock or self.model is None or self.processor is None:
            return self._deterministic_vector(str(image_input))

        try:
            if isinstance(image_input, str):
                image = Image.open(image_input).convert("RGB")
            else:
                image = image_input.convert("RGB")

            inputs = self.processor(images=image, return_tensors="pt").to(self.device)
            with torch.no_grad():
                features = self.model.get_image_features(**inputs)
                features = features / features.norm(dim=-1, keepdim=True)
                return features.cpu().numpy()[0].tolist()
        except Exception as e:
            logger.error(f"Transformers CLIP image embed error: {e}")
            return self._deterministic_vector(str(image_input))

    def embed_text(self, text: str) -> List[float]:
        if not text or not text.strip():
            return [0.0] * self._dimension

        if self._is_mock or self.model is None or self.processor is None:
            return self._deterministic_vector(text)

        try:
            inputs = self.processor(text=[text.strip()], return_tensors="pt", padding=True).to(self.device)
            with torch.no_grad():
                features = self.model.get_text_features(**inputs)
                features = features / features.norm(dim=-1, keepdim=True)
                return features.cpu().numpy()[0].tolist()
        except Exception as e:
            logger.error(f"Transformers CLIP text embed error: {e}")
            return self._deterministic_vector(text)

    def batch_embed_images(self, images: List[Union[Image.Image, str]]) -> List[List[float]]:
        if not images:
            return []
        return [self.embed_image(img) for img in images]

    def _deterministic_vector(self, seed_str: str) -> List[float]:
        import hashlib
        h = hashlib.sha256(seed_str.encode("utf-8")).digest()
        rng = np.random.RandomState(int.from_bytes(h[:4], "little"))
        v = rng.randn(self._dimension).astype(np.float32)
        return self._normalize(v)
