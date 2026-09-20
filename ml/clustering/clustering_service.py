import numpy as np
from typing import List, Dict, Any, Tuple
from collections import Counter
import re
from sklearn.cluster import KMeans, DBSCAN
from sklearn.feature_extraction.text import TfidfVectorizer
from apps.api.app.core.logging import logger

class ClusteringService:
    """Performs image clustering on multimodal embeddings and derives human-interpretable labels."""

    def __init__(self):
        pass

    def run_clustering(
        self,
        images_data: List[Dict[str, Any]],
        algorithm: str = "kmeans",
        n_clusters: int = 5
    ) -> List[Dict[str, Any]]:
        """
        images_data: list of {
            "image_id": str,
            "vector": List[float],
            "filename": str,
            "ocr_text": str
        }
        Returns list of cluster summary dicts.
        """
        if not images_data or len(images_data) < 2:
            return []

        vectors = np.array([item["vector"] for item in images_data])
        n_samples = len(vectors)
        actual_clusters = min(n_clusters, n_samples)

        if algorithm == "dbscan":
            model = DBSCAN(eps=0.35, min_samples=2, metric="cosine")
            labels = model.fit_predict(vectors)
        else:
            model = KMeans(n_clusters=actual_clusters, random_state=42, n_init="auto")
            labels = model.fit_predict(vectors)

        # Group images by cluster
        clusters: Dict[int, List[Dict[str, Any]]] = {}
        for idx, cluster_label in enumerate(labels):
            cluster_id = int(cluster_label)
            if cluster_id not in clusters:
                clusters[cluster_id] = []
            item = images_data[idx].copy()
            item["cluster_id"] = cluster_id
            clusters[cluster_id].append(item)

        results = []
        for cluster_id, items in sorted(clusters.items()):
            label, top_keywords = self._generate_cluster_label(items)
            results.append({
                "cluster_id": cluster_id,
                "label": label,
                "image_count": len(items),
                "top_keywords": top_keywords,
                "image_ids": [it["image_id"] for it in items],
                "sample_images": [
                    {"image_id": it["image_id"], "filename": it.get("filename", "")}
                    for it in items[:6]
                ]
            })

        return results

    def _generate_cluster_label(self, items: List[Dict[str, Any]]) -> Tuple[str, List[str]]:
        """Extract dominant keywords from OCR and filenames to generate a human-readable cluster title."""
        corpus = []
        for it in items:
            text = f"{it.get('filename', '')} {it.get('ocr_text', '')}"
            cleaned = re.sub(r'[^a-zA-Z0-9\s]', ' ', text.lower())
            corpus.append(cleaned)

        stop_words = {"png", "jpg", "jpeg", "webp", "image", "screenshot", "the", "and", "is", "for", "with", "this", "that"}
        vectorizer = TfidfVectorizer(stop_words=list(stop_words), max_features=10)
        try:
            tfidf = vectorizer.fit_transform(corpus)
            feature_names = vectorizer.get_feature_names_out()
            scores = np.asarray(tfidf.sum(axis=0)).ravel()
            top_indices = scores.argsort()[::-1][:5]
            top_keywords = [feature_names[i] for i in top_indices if len(feature_names[i]) > 2]
        except Exception:
            # Fallback to simple word counter
            words = []
            for c in corpus:
                words.extend([w for w in c.split() if len(w) > 3 and w not in stop_words])
            top_keywords = [w for w, _ in Counter(words).most_common(5)]

        if not top_keywords:
            label = "Visual Collection"
        elif len(top_keywords) == 1:
            label = top_keywords[0].capitalize()
        else:
            label = f"{top_keywords[0].capitalize()} & {top_keywords[1].capitalize()}"

        return label, top_keywords

_clustering_service_instance = None

def get_clustering_service() -> ClusteringService:
    global _clustering_service_instance
    if _clustering_service_instance is None:
        _clustering_service_instance = ClusteringService()
    return _clustering_service_instance
