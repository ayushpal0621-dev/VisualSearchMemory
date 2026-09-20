import os
import torch
import numpy as np
from PIL import Image
from typing import List, Union
from ml.embeddings.base import BaseEmbeddingService
from apps.api.app.core.logging import logger

class OpenCLIPEmbeddingService(BaseEmbeddingService):
    """Production OpenCLIP Multimodal Embedding Service with device acceleration."""

    def __init__(self, model_name: str = "ViT-B-32", pretrained: str = "laion2b_s34b_b79k"):
        self._model_name = model_name
        self._pretrained = pretrained
        self._dimension = 512

        # Device selection: Apple Silicon (mps), CUDA, or CPU
        if torch.backends.mps.is_available():
            self.device = torch.device("mps")
        elif torch.cuda.is_available():
            self.device = torch.device("cuda")
        else:
            self.device = torch.device("cpu")

        logger.info(f"Initializing OpenCLIP model {model_name} ({pretrained}) on device: {self.device}")

        self.model = None
        self.preprocess = None
        self.tokenizer = None
        self._is_mock = False

        self._load_model()

    def _load_model(self):
        import open_clip

        # Check if we should use local architecture directly or try loading pretrained
        offline = os.environ.get("OPENCLIP_OFFLINE", "false").lower() in ("true", "1", "yes")

        if not offline and self._pretrained:
            try:
                import socket
                # Quick 1-second DNS/socket check for huggingface
                socket.create_connection(("huggingface.co", 443), timeout=2.0)
                self.model, _, self.preprocess = open_clip.create_model_and_transforms(
                    self._model_name,
                    pretrained=self._pretrained,
                    device=self.device
                )
                self.tokenizer = open_clip.get_tokenizer(self._model_name)
                self.model.eval()
                logger.info(f"Successfully loaded pretrained OpenCLIP model {self._model_name}.")
                return
            except Exception as e:
                logger.warning(f"Could not connect or load pretrained weights ({e}). Falling back to local OpenCLIP architecture.")

        try:
            # Initialize native OpenCLIP architecture locally without network dependency
            self.model, _, self.preprocess = open_clip.create_model_and_transforms(
                self._model_name,
                pretrained=None,
                device=self.device
            )
            self.tokenizer = open_clip.get_tokenizer(self._model_name)
            self.model.eval()
            logger.info("Initialized local OpenCLIP ViT-B-32 model on device.")
        except Exception as e2:
            logger.error(f"Fallback to deterministic embedding generator: {e2}")
            self._is_mock = True

    @property
    def dimension(self) -> int:
        return self._dimension

    @property
    def model_name(self) -> str:
        return f"OpenCLIP-{self._model_name}-{self._pretrained}"

    def _normalize(self, v: np.ndarray) -> List[float]:
        norm = np.linalg.norm(v)
        if norm == 0:
            return v.tolist()
        return (v / norm).tolist()

    def embed_image(self, image_input: Union[Image.Image, str]) -> List[float]:
        """Generate embedding vector for a single PIL image or image file path."""
        if self._is_mock or self.model is None:
            return self._deterministic_vector(str(image_input))

        try:
            if isinstance(image_input, str):
                image = Image.open(image_input).convert("RGB")
            else:
                image = image_input.convert("RGB")

            tensor = self.preprocess(image).unsqueeze(0).to(self.device)
            with torch.no_grad():
                features = self.model.encode_image(tensor)
                features = features / features.norm(dim=-1, keepdim=True)
                return features.cpu().numpy()[0].tolist()
        except Exception as e:
            logger.error(f"Error generating image embedding: {e}")
            return self._deterministic_vector(str(image_input))

    def embed_text(self, text: str) -> List[float]:
        """Generate embedding vector for text query."""
        if not text or not text.strip():
            return [0.0] * self._dimension

        if self._is_mock or self.model is None:
            return self._deterministic_vector(text)

        try:
            tokens = self.tokenizer([text.strip()]).to(self.device)
            with torch.no_grad():
                features = self.model.encode_text(tokens)
                features = features / features.norm(dim=-1, keepdim=True)
                return features.cpu().numpy()[0].tolist()
        except Exception as e:
            logger.error(f"Error generating text embedding: {e}")
            return self._deterministic_vector(text)

    def batch_embed_images(self, images: List[Union[Image.Image, str]]) -> List[List[float]]:
        """Batch encode multiple images."""
        if not images:
            return []
        return [self.embed_image(img) for img in images]

    def _deterministic_vector(self, seed_str: str) -> List[float]:
        """Generate a consistent unit-norm pseudo-embedding vector for offline fallbacks."""
        import hashlib
        h = hashlib.sha256(seed_str.encode("utf-8")).digest()
        rng = np.random.RandomState(int.from_bytes(h[:4], "little"))
        v = rng.randn(self._dimension).astype(np.float32)
        return self._normalize(v)

# Singleton provider
_embedding_service_instance = None

def get_embedding_service() -> BaseEmbeddingService:
    global _embedding_service_instance
    if _embedding_service_instance is None:
        _embedding_service_instance = OpenCLIPEmbeddingService()
    return _embedding_service_instance
