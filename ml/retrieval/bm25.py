import re
from typing import List, Dict, Any, Tuple
from rank_bm25 import BM25Plus, BM25Okapi
from apps.api.app.core.logging import logger

class BM25Retriever:
    """In-memory BM25+ index over OCR text, filenames, and image tags."""

    def __init__(self):
        self.corpus_ids: List[str] = []
        self.tokenized_corpus: List[List[str]] = []
        self.bm25: Any = None
        self._doc_map: Dict[str, Dict[str, Any]] = {}

    def _tokenize(self, text: str) -> List[str]:
        if not text:
            return []
        tokens = re.findall(r'[a-zA-Z0-9]+', text.lower())
        return [t for t in tokens if len(t) > 1]

    def build_index(self, documents: List[Dict[str, Any]]):
        """
        Build or replace the BM25 index from a list of documents.
        Each doc must have 'image_id', 'text', 'filename', and optional 'tags'.
        """
        self.corpus_ids = []
        self.tokenized_corpus = []
        self._doc_map = {}

        for doc in documents:
            image_id = doc["image_id"]
            combined_text = f"{doc.get('filename', '')} {doc.get('text', '')} {' '.join(doc.get('tags', []))}"
            tokens = self._tokenize(combined_text)

            self.corpus_ids.append(image_id)
            self.tokenized_corpus.append(tokens)
            self._doc_map[image_id] = {
                "text": doc.get("text", ""),
                "filename": doc.get("filename", ""),
                "tokens": set(tokens)
            }

        if self.tokenized_corpus:
            try:
                self.bm25 = BM25Plus(self.tokenized_corpus)
            except Exception:
                self.bm25 = BM25Okapi(self.tokenized_corpus)
            logger.info(f"Built BM25 index with {len(self.corpus_ids)} documents.")
        else:
            self.bm25 = None

    def search(self, query: str, limit: int = 24) -> List[Dict[str, Any]]:
        """
        Search documents using BM25+.
        Returns list of {'image_id': ..., 'score': float (normalized 0..1), 'matched_terms': [...]}
        """
        if not self.bm25 or not self.corpus_ids:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        raw_scores = self.bm25.get_scores(query_tokens)
        max_score = max(raw_scores) if len(raw_scores) > 0 and max(raw_scores) > 0 else 1.0

        results = []
        for idx, score in enumerate(raw_scores):
            image_id = self.corpus_ids[idx]
            doc_tokens = self._doc_map.get(image_id, {}).get("tokens", set())
            matched = [t for t in query_tokens if t in doc_tokens]

            if matched or score > 0.001:
                # If matched terms exist, ensure score reflects match quality
                base_score = float(score / max_score) if max_score > 0 else 0.0
                overlap_ratio = len(matched) / len(query_tokens)
                normalized_score = min(1.0, max(base_score, overlap_ratio * 0.9))

                results.append({
                    "image_id": image_id,
                    "score": round(normalized_score, 4),
                    "raw_score": float(score),
                    "matched_terms": matched
                })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:limit]

# Singleton provider
_bm25_retriever_instance = None

def get_bm25_retriever() -> BM25Retriever:
    global _bm25_retriever_instance
    if _bm25_retriever_instance is None:
        _bm25_retriever_instance = BM25Retriever()
    return _bm25_retriever_instance
