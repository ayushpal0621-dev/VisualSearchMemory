from typing import List, Dict, Any, Optional

def reciprocal_rank_fusion(
    ranked_lists: List[List[Dict[str, Any]]],
    k: int = 60
) -> List[Dict[str, Any]]:
    """
    Standard Reciprocal Rank Fusion (RRF):
    RRF_score(d) = sum_{m in models} 1 / (k + rank_m(d))
    """
    rrf_scores: Dict[str, float] = {}
    doc_meta: Dict[str, Dict[str, Any]] = {}

    for ranked_list in ranked_lists:
        for rank, item in enumerate(ranked_list, start=1):
            doc_id = item["image_id"]
            if doc_id not in rrf_scores:
                rrf_scores[doc_id] = 0.0
                doc_meta[doc_id] = item

            rrf_scores[doc_id] += 1.0 / (k + rank)

    sorted_docs = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
    fused_results = []
    max_rrf = sorted_docs[0][1] if sorted_docs else 1.0

    for doc_id, score in sorted_docs:
        base_item = doc_meta[doc_id]
        fused_results.append({
            "image_id": doc_id,
            "fused_score": round(float(score / max_rrf), 4),
            "raw_rrf": score,
            "item": base_item
        })

    return fused_results

def linear_weighted_fusion(
    vector_candidates: List[Dict[str, Any]],
    bm25_candidates: List[Dict[str, Any]],
    semantic_weight: float = 0.6,
    keyword_weight: float = 0.3,
    metadata_weight: float = 0.1,
    metadata_scores: Optional[Dict[str, float]] = None
) -> List[Dict[str, Any]]:
    """
    Linear candidate combination with explicit signal tracking:
    final_score = w_s * semantic + w_k * keyword + w_m * metadata
    """
    if metadata_scores is None:
        metadata_scores = {}

    all_ids = set()
    vec_map = {item["image_id"]: item for item in vector_candidates}
    bm25_map = {item["image_id"]: item for item in bm25_candidates}

    all_ids.update(vec_map.keys())
    all_ids.update(bm25_map.keys())

    fused_candidates = []

    for image_id in all_ids:
        vec_item = vec_map.get(image_id)
        bm25_item = bm25_map.get(image_id)

        s_score = vec_item["score"] if vec_item else 0.0
        k_score = bm25_item["score"] if bm25_item else 0.0
        m_score = metadata_scores.get(image_id, 1.0 if (vec_item or bm25_item) else 0.0)

        final_score = (
            s_score * semantic_weight +
            k_score * keyword_weight +
            m_score * metadata_weight
        )

        matched_terms = bm25_item.get("matched_terms", []) if bm25_item else []
        payload = (vec_item.get("payload") if vec_item else None) or {}

        fused_candidates.append({
            "image_id": image_id,
            "final_score": round(float(final_score), 4),
            "semantic_score": round(float(s_score), 4),
            "keyword_score": round(float(k_score), 4),
            "metadata_score": round(float(m_score), 4),
            "matched_terms": matched_terms,
            "payload": payload
        })

    fused_candidates.sort(key=lambda x: x["final_score"], reverse=True)
    return fused_candidates
