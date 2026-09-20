from typing import List, Dict, Any

class SearchReranker:
    """Reranker and retrieval signal explanation generator."""

    def __init__(self):
        pass

    def rerank_and_explain(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int = 24
    ) -> List[Dict[str, Any]]:
        """
        Calculates final ranked list and provides real explainable retrieval reasons.
        """
        results = []
        for c in candidates:
            semantic_score = c.get("semantic_score", 0.0)
            keyword_score = c.get("keyword_score", 0.0)
            metadata_score = c.get("metadata_score", 0.0)
            final_score = c.get("final_score", 0.0)
            matched_terms = c.get("matched_terms", [])
            payload = c.get("payload", {})

            # Generate factual reasons from actual retrieval signals
            reasons = []
            if semantic_score > 0.70:
                reasons.append(f"Strong visual & semantic similarity ({int(semantic_score * 100)}%)")
            elif semantic_score > 0.45:
                reasons.append(f"Moderate visual & semantic relevance ({int(semantic_score * 100)}%)")

            if matched_terms:
                unique_terms = list(set(matched_terms))[:4]
                formatted_terms = ", ".join(f'"{t}"' for t in unique_terms)
                reasons.append(f"OCR keyword match on: {formatted_terms}")

            if payload.get("filename"):
                fn_lower = payload["filename"].lower()
                query_tokens = query.lower().split()
                if any(qt in fn_lower for qt in query_tokens if len(qt) > 2):
                    reasons.append(f"Filename contains matching term ({payload['filename']})")

            if payload.get("cluster_id") is not None:
                reasons.append(f"Belongs to thematic cluster #{payload['cluster_id']}")

            if not reasons:
                reasons.append("Retrieved via baseline vector index similarity")

            results.append({
                "image_id": c["image_id"],
                "score": final_score,
                "signals": {
                    "semantic_score": semantic_score,
                    "keyword_score": keyword_score,
                    "metadata_score": metadata_score,
                    "final_score": final_score,
                    "matched_terms": matched_terms,
                    "explanation_reasons": reasons
                }
            })

        # Ensure sorted by score
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

_reranker_instance = None

def get_reranker() -> SearchReranker:
    global _reranker_instance
    if _reranker_instance is None:
        _reranker_instance = SearchReranker()
    return _reranker_instance
