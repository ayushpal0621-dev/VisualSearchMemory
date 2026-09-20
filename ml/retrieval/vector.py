import os
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct, Filter, FieldCondition,
    MatchValue, Range
)
from apps.api.app.core.config import settings
from apps.api.app.core.logging import logger

class QdrantVectorRetriever:
    """Production Qdrant Vector Retriever with automatic remote/embedded fallback."""

    def __init__(self, collection_name: str = None):
        self.collection_name = collection_name or settings.QDRANT_COLLECTION_NAME
        self.dimension = settings.EMBEDDING_DIMENSION
        self.client = None

        self._connect()
        self._ensure_collection()

    def _connect(self):
        """Connect to remote Qdrant server or fallback to local disk storage."""
        if settings.QDRANT_URL:
            try:
                # Test connection to remote server
                client = QdrantClient(url=settings.QDRANT_URL, timeout=3.0)
                client.get_collections()
                self.client = client
                logger.info(f"Connected to remote Qdrant server at {settings.QDRANT_URL}.")
                return
            except Exception as e:
                logger.warning(f"Could not connect to Qdrant at {settings.QDRANT_URL}: {e}. Falling back to embedded on-disk storage.")

        os.makedirs(settings.QDRANT_STORAGE_PATH, exist_ok=True)
        self.client = QdrantClient(path=settings.QDRANT_STORAGE_PATH)
        logger.info(f"Initialized embedded Qdrant client at {settings.QDRANT_STORAGE_PATH}.")

    def _ensure_collection(self):
        """Ensure collection exists with Cosine distance metric."""
        try:
            collections = [c.name for c in self.client.get_collections().collections]
            if self.collection_name not in collections:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=self.dimension, distance=Distance.COSINE),
                )
                logger.info(f"Created Qdrant collection: {self.collection_name} (dim={self.dimension})")
        except Exception as e:
            logger.error(f"Error checking/creating Qdrant collection: {e}")

    def upsert_vector(
        self,
        image_id: str,
        vector: List[float],
        payload: Dict[str, Any]
    ) -> bool:
        """Insert or update an image vector with payload metadata."""
        try:
            point = PointStruct(
                id=image_id,
                vector=vector,
                payload=payload
            )
            self.client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )
            return True
        except Exception as e:
            logger.error(f"Failed to upsert vector for image {image_id}: {e}")
            return False

    def batch_upsert_vectors(self, points: List[Dict[str, Any]]) -> bool:
        """Batch upsert points: [{'image_id': ..., 'vector': ..., 'payload': ...}]."""
        try:
            point_structs = [
                PointStruct(
                    id=p["image_id"],
                    vector=p["vector"],
                    payload=p["payload"]
                )
                for p in points
            ]
            self.client.upsert(
                collection_name=self.collection_name,
                points=point_structs
            )
            return True
        except Exception as e:
            logger.error(f"Failed to batch upsert vectors: {e}")
            return False

    def delete_vector(self, image_id: str) -> bool:
        """Delete an image vector by id."""
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=[image_id]
            )
            return True
        except Exception as e:
            logger.error(f"Failed to delete vector for image {image_id}: {e}")
            return False

    def search_similar(
        self,
        query_vector: List[float],
        limit: int = 24,
        score_threshold: Optional[float] = None,
        filter_conditions: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Perform vector similarity search with optional metadata filters.
        Returns list of {'image_id': ..., 'score': ..., 'payload': ...}
        """
        try:
            qdrant_filter = self._build_filter(filter_conditions) if filter_conditions else None

            # Qdrant client compatibility for search
            results = self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                limit=limit,
                query_filter=qdrant_filter,
                score_threshold=score_threshold,
            ).points

            return [
                {
                    "image_id": str(r.id),
                    "score": max(0.0, min(1.0, float(r.score))),
                    "payload": r.payload or {}
                }
                for r in results
            ]
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return []

    def get_vector(self, image_id: str) -> Optional[List[float]]:
        """Retrieve the embedding vector of an image."""
        try:
            points = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[image_id],
                with_vectors=True
            )
            if points and points[0].vector:
                return points[0].vector
            return None
        except Exception as e:
            logger.error(f"Failed to retrieve vector for {image_id}: {e}")
            return None

    def _build_filter(self, conditions: Dict[str, Any]) -> Optional[Filter]:
        """Convert dictionary filter conditions to Qdrant Filter."""
        must_clauses = []

        if conditions.get("mime_types"):
            for mime in conditions["mime_types"]:
                must_clauses.append(FieldCondition(key="mime_type", match=MatchValue(value=mime)))

        if conditions.get("cluster_id") is not None:
            must_clauses.append(FieldCondition(key="cluster_id", match=MatchValue(value=conditions["cluster_id"])))

        if conditions.get("has_ocr") is not None:
            must_clauses.append(FieldCondition(key="has_ocr", match=MatchValue(value=conditions["has_ocr"])))

        if conditions.get("date_from") or conditions.get("date_to"):
            date_range = {}
            if conditions.get("date_from"):
                date_range["gte"] = conditions["date_from"]
            if conditions.get("date_to"):
                date_range["lte"] = conditions["date_to"]
            must_clauses.append(FieldCondition(key="created_timestamp", range=Range(**date_range)))

        if not must_clauses:
            return None
        return Filter(must=must_clauses)

# Singleton provider
_vector_retriever_instance = None

def get_vector_retriever() -> QdrantVectorRetriever:
    global _vector_retriever_instance
    if _vector_retriever_instance is None:
        _vector_retriever_instance = QdrantVectorRetriever()
    return _vector_retriever_instance
