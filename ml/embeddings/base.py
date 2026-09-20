from abc import ABC, abstractmethod
from typing import List, Union
from PIL import Image
import numpy as np

class BaseEmbeddingService(ABC):
    """Abstract interface for Multimodal Embedding Services."""

    @abstractmethod
    def embed_image(self, image: Union[Image.Image, str]) -> List[float]:
        """Generate a normalized embedding vector for an image."""
        pass

    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """Generate a normalized embedding vector for text/query."""
        pass

    @abstractmethod
    def batch_embed_images(self, images: List[Union[Image.Image, str]]) -> List[List[float]]:
        """Batch generate normalized embedding vectors for images."""
        pass

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Vector dimension."""
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Model identifier and version."""
        pass
