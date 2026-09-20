import time
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from apps.api.app.models.image import Image
from apps.api.app.models.history import SearchHistory
from apps.api.app.models.collection import CollectionImage
from apps.api.app.schemas.search import (
    SearchRequest, SearchResponse, SearchResultItem, SearchFilters, SearchWeights,
    SimilarImageRequest, RetrievalSignals
)
from apps.api.app.schemas.image import ImageResponse, ImageMetadataResponse, OCRResultResponse
from apps.api.app.services.query_understanding_service import query_understanding_service
from ml.embeddings import get_embedding_service
from ml.retrieval import get_vector_retriever, get_bm25_retriever, linear_weighted_fusion
from ml.reranking import get_reranker
from apps.api.app.core.config import settings
from apps.api.app.core.logging import logger

class SearchService:
    """Dedicated search orchestrator providing multimodal semantic, OCR, hybrid, and similar image retrieval."""

    def __init__(self):
        self.embedding_service = get_embedding_service()
        self.vector_retriever = get_vector_retriever()
        self.bm25_retriever = get_bm25_retriever()
        self.reranker = get_reranker()

    async def search(self, db: Session, req: SearchRequest) -> SearchResponse:
        start_time = time.perf_counter()

        # 1. Query Understanding
        understanding = await query_understanding_service.analyze_query(req.query)
        semantic_query = understanding.get("semantic_query") or req.query
        keyword_list = understanding.get("keywords") or [req.query]

        weights = req.weights or SearchWeights(
            semantic=settings.DEFAULT_SEMANTIC_WEIGHT,
            keyword=settings.DEFAULT_KEYWORD_WEIGHT,
            metadata=settings.DEFAULT_METADATA_WEIGHT
        )

        vector_candidates = []
        bm25_candidates = []

        # 2. Retrieval according to mode
        # Mode: semantic, ocr, hybrid
        if req.search_mode in ["semantic", "hybrid"]:
            query_vector = self.embedding_service.embed_text(semantic_query)
            qdrant_filter_params = {}
            if req.filters:
                if req.filters.mime_types:
                    qdrant_filter_params["mime_types"] = req.filters.mime_types
                if req.filters.cluster_id is not None:
                    qdrant_filter_params["cluster_id"] = req.filters.cluster_id
                if req.filters.has_ocr is not None:
                    qdrant_filter_params["has_ocr"] = req.filters.has_ocr
                if req.filters.date_from:
                    qdrant_filter_params["date_from"] = int(req.filters.date_from.timestamp())
                if req.filters.date_to:
                    qdrant_filter_params["date_to"] = int(req.filters.date_to.timestamp())

            vector_candidates = self.vector_retriever.search_similar(
                query_vector=query_vector,
                limit=max(req.limit * 2, 40),
                score_threshold=req.filters.similarity_threshold if req.filters else 0.0,
                filter_conditions=qdrant_filter_params
            )

        if req.search_mode in ["ocr", "hybrid"]:
            # Perform BM25 on extracted OCR text
            bm25_query = " ".join(keyword_list)
            bm25_candidates = self.bm25_retriever.search(bm25_query, limit=max(req.limit * 2, 40))

        # 3. Collection filtering if requested
        if req.filters and req.filters.collection_id:
            valid_col_ids = set(
                row[0] for row in db.query(CollectionImage.image_id).filter(
                    CollectionImage.collection_id == req.filters.collection_id
                ).all()
            )
            vector_candidates = [c for c in vector_candidates if c["image_id"] in valid_col_ids]
            bm25_candidates = [c for c in bm25_candidates if c["image_id"] in valid_col_ids]

        # 4. Candidate Fusion
        # Adjust weights if mode is purely semantic or purely ocr
        effective_sem_weight = 1.0 if req.search_mode == "semantic" else (0.0 if req.search_mode == "ocr" else weights.semantic)
        effective_kw_weight = 1.0 if req.search_mode == "ocr" else (0.0 if req.search_mode == "semantic" else weights.keyword)
        effective_meta_weight = 0.0 if req.search_mode in ["semantic", "ocr"] else weights.metadata

        fused = linear_weighted_fusion(
            vector_candidates=vector_candidates,
            bm25_candidates=bm25_candidates,
            semantic_weight=effective_sem_weight,
            keyword_weight=effective_kw_weight,
            metadata_weight=effective_meta_weight
        )

        # 5. Reranking and Explanation
        if getattr(req, "enable_reranking", True):
            ranked_candidates = self.reranker.rerank_and_explain(
                query=req.query,
                candidates=fused,
                top_k=req.limit
            )
        else:
            ranked_candidates = fused[:req.limit]
            for c in ranked_candidates:
                c["score"] = c.get("fused_score", 0.0)
                if "signals" not in c:
                    c["signals"] = {
                        "semantic_score": c.get("semantic_score", 0.0),
                        "keyword_score": c.get("keyword_score", 0.0),
                        "metadata_score": c.get("metadata_score", 0.0),
                        "final_score": c.get("fused_score", 0.0),
                        "matched_terms": [],
                        "explanation_reasons": ["Weighted linear score fusion"]
                    }

        # 6. Fetch full Image records from DB
        doc_ids = [item["image_id"] for item in ranked_candidates]
        images_dict = {}
        if doc_ids:
            images = db.query(Image).filter(Image.id.in_(doc_ids)).all()
            for img in images:
                images_dict[img.id] = img

        results: List[SearchResultItem] = []
        for item in ranked_candidates:
            img = images_dict.get(item["image_id"])
            if not img or img.status != "completed":
                continue

            # Build collection tags
            col_names = [ci.collection.name for ci in img.collection_items if ci.collection]

            img_resp = ImageResponse(
                id=img.id,
                filename=img.filename,
                original_name=img.original_name,
                mime_type=img.mime_type,
                file_size=img.file_size,
                width=img.width,
                height=img.height,
                file_hash=img.file_hash,
                phash=img.phash,
                status=img.status,
                error_message=img.error_message,
                cluster_id=img.cluster_id,
                created_at=img.created_at,
                updated_at=img.updated_at,
                metadata=ImageMetadataResponse.model_validate(img.metadata_rel) if img.metadata_rel else None,
                ocr=OCRResultResponse.model_validate(img.ocr_result) if img.ocr_result else None,
                collections=col_names
            )

            signals = RetrievalSignals(**item["signals"])
            results.append(SearchResultItem(image=img_resp, score=item["score"], signals=signals))

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # 7. Record search in history
        try:
            history = SearchHistory(
                query=req.query,
                search_mode=req.search_mode,
                filters=req.filters.model_dump() if req.filters else None,
                result_count=len(results),
                latency_ms=latency_ms
            )
            db.add(history)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to record search history: {e}")
            db.rollback()

        return SearchResponse(
            query=req.query,
            search_mode=req.search_mode,
            total_found=len(results),
            latency_ms=latency_ms,
            results=results,
            query_understanding=understanding
        )

    def find_similar(self, db: Session, req: SimilarImageRequest) -> SearchResponse:
        """Find visually similar images given a reference image ID."""
        start_time = time.perf_counter()
        ref_image = db.query(Image).filter(Image.id == req.image_id).first()
        if not ref_image:
            return SearchResponse(query="similar", search_mode="similar", total_found=0, latency_ms=0.0, results=[])

        # Retrieve image vector from Qdrant or compute it
        vector = self.vector_retriever.get_vector(req.image_id)
        if not vector:
            vector = self.embedding_service.embed_image(ref_image.file_path)

        candidates = self.vector_retriever.search_similar(
            query_vector=vector,
            limit=req.limit + 1, # extra 1 to exclude self
            score_threshold=req.similarity_threshold
        )

        # Filter out self
        filtered_candidates = [c for c in candidates if c["image_id"] != req.image_id][:req.limit]

        doc_ids = [c["image_id"] for c in filtered_candidates]
        images = {img.id: img for img in db.query(Image).filter(Image.id.in_(doc_ids)).all()} if doc_ids else {}

        results = []
        for c in filtered_candidates:
            img = images.get(c["image_id"])
            if not img:
                continue

            signals = RetrievalSignals(
                semantic_score=c["score"],
                keyword_score=0.0,
                metadata_score=1.0,
                final_score=c["score"],
                matched_terms=[],
                explanation_reasons=[
                    f"Visual similarity: {int(c['score'] * 100)}%",
                    f"Cosine distance in OpenCLIP vector space to {ref_image.original_name}"
                ]
            )

            img_resp = ImageResponse(
                id=img.id,
                filename=img.filename,
                original_name=img.original_name,
                mime_type=img.mime_type,
                file_size=img.file_size,
                width=img.width,
                height=img.height,
                file_hash=img.file_hash,
                phash=img.phash,
                status=img.status,
                cluster_id=img.cluster_id,
                created_at=img.created_at,
                updated_at=img.updated_at,
                metadata=ImageMetadataResponse.model_validate(img.metadata_rel) if img.metadata_rel else None,
                ocr=OCRResultResponse.model_validate(img.ocr_result) if img.ocr_result else None
            )
            results.append(SearchResultItem(image=img_resp, score=c["score"], signals=signals))

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return SearchResponse(
            query=f"Visual similarity to {ref_image.original_name}",
            search_mode="similar",
            total_found=len(results),
            latency_ms=latency_ms,
            results=results
        )

search_service = SearchService()
