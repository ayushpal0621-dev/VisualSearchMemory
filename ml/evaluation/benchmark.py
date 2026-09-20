import time
import json
import os
from typing import List, Dict, Any, Set, Optional
from pathlib import Path
from apps.api.app.core.logging import logger

class MLEvaluationBenchmark:
    """
    ML Evaluation suite computing standard IR metrics:
    Precision@K, Recall@K, MRR, and Search Latency across retrieval strategies.
    """

    def __init__(self, output_path: str = "./data/evaluation/benchmark_results.json"):
        self.output_path = output_path
        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)

    @staticmethod
    def precision_at_k(retrieved_ids: List[str], ground_truth_ids: Set[str], k: int) -> float:
        if not retrieved_ids or k <= 0:
            return 0.0
        top_k = retrieved_ids[:k]
        hits = sum(1 for doc_id in top_k if doc_id in ground_truth_ids)
        return float(hits / k)

    @staticmethod
    def recall_at_k(retrieved_ids: List[str], ground_truth_ids: Set[str], k: int) -> float:
        if not ground_truth_ids or k <= 0:
            return 0.0
        top_k = retrieved_ids[:k]
        hits = sum(1 for doc_id in top_k if doc_id in ground_truth_ids)
        return float(hits / len(ground_truth_ids))

    @staticmethod
    def reciprocal_rank(retrieved_ids: List[str], ground_truth_ids: Set[str]) -> float:
        for rank, doc_id in enumerate(retrieved_ids, start=1):
            if doc_id in ground_truth_ids:
                return 1.0 / rank
        return 0.0

    async def evaluate_strategy_async(
        self,
        strategy_name: str,
        queries: List[Dict[str, Any]],
        retrieval_fn: Any
    ) -> Dict[str, Any]:
        """Async version of evaluate_strategy supporting coroutine retrieval functions."""
        import inspect
        p5_scores = []
        p10_scores = []
        r5_scores = []
        r10_scores = []
        rr_scores = []
        latencies = []

        for q in queries:
            query_text = q["query"]
            ground_truth = set(q.get("relevant_image_ids", []))
            if not ground_truth:
                continue

            start_t = time.perf_counter()
            if inspect.iscoroutinefunction(retrieval_fn):
                retrieved_ids, fn_latency = await retrieval_fn(query_text)
            else:
                retrieved_ids, fn_latency = retrieval_fn(query_text)
            latency_ms = fn_latency if fn_latency > 0 else (time.perf_counter() - start_t) * 1000

            p5 = self.precision_at_k(retrieved_ids, ground_truth, 5)
            p10 = self.precision_at_k(retrieved_ids, ground_truth, 10)
            r5 = self.recall_at_k(retrieved_ids, ground_truth, 5)
            r10 = self.recall_at_k(retrieved_ids, ground_truth, 10)
            rr = self.reciprocal_rank(retrieved_ids, ground_truth)

            p5_scores.append(p5)
            p10_scores.append(p10)
            r5_scores.append(r5)
            r10_scores.append(r10)
            rr_scores.append(rr)
            latencies.append(latency_ms)

        n = max(1, len(p5_scores))
        return {
            "strategy": strategy_name,
            "queries_evaluated": len(p5_scores),
            "precision_at_5": round(sum(p5_scores) / n, 4),
            "precision_at_10": round(sum(p10_scores) / n, 4),
            "recall_at_5": round(sum(r5_scores) / n, 4),
            "recall_at_10": round(sum(r10_scores) / n, 4),
            "mrr": round(sum(rr_scores) / n, 4),
            "avg_latency_ms": round(sum(latencies) / n, 2),
        }

    def evaluate_strategy(
        self,
        strategy_name: str,
        queries: List[Dict[str, Any]],
        retrieval_fn: Any
    ) -> Dict[str, Any]:
        """
        Runs the retrieval function for all queries and computes metrics.
        retrieval_fn(query_text) -> (retrieved_image_ids, latency_ms)
        """
        p5_scores = []
        p10_scores = []
        r5_scores = []
        r10_scores = []
        rr_scores = []
        latencies = []

        for q in queries:
            query_text = q["query"]
            ground_truth = set(q.get("relevant_image_ids", []))
            if not ground_truth:
                continue

            start_t = time.perf_counter()
            retrieved_ids, fn_latency = retrieval_fn(query_text)
            latency_ms = fn_latency if fn_latency > 0 else (time.perf_counter() - start_t) * 1000

            p5 = self.precision_at_k(retrieved_ids, ground_truth, 5)
            p10 = self.precision_at_k(retrieved_ids, ground_truth, 10)
            r5 = self.recall_at_k(retrieved_ids, ground_truth, 5)
            r10 = self.recall_at_k(retrieved_ids, ground_truth, 10)
            rr = self.reciprocal_rank(retrieved_ids, ground_truth)

            p5_scores.append(p5)
            p10_scores.append(p10)
            r5_scores.append(r5)
            r10_scores.append(r10)
            rr_scores.append(rr)
            latencies.append(latency_ms)

        n = max(1, len(p5_scores))
        results = {
            "strategy": strategy_name,
            "queries_evaluated": len(p5_scores),
            "precision_at_5": round(sum(p5_scores) / n, 4),
            "precision_at_10": round(sum(p10_scores) / n, 4),
            "recall_at_5": round(sum(r5_scores) / n, 4),
            "recall_at_10": round(sum(r10_scores) / n, 4),
            "mrr": round(sum(rr_scores) / n, 4),
            "avg_latency_ms": round(sum(latencies) / n, 2),
        }
        return results

    def save_results(self, benchmark_summary: Dict[str, Any]):
        with open(self.output_path, "w") as f:
            json.dump(benchmark_summary, f, indent=2)
        logger.info(f"Saved benchmark evaluation results to {self.output_path}")

    def load_results(self) -> Optional[Dict[str, Any]]:
        if os.path.exists(self.output_path):
            try:
                with open(self.output_path, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading benchmark results: {e}")
        return None
