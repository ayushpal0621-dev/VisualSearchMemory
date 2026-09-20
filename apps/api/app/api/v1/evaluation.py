import json
import time
import os
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from apps.api.app.core.database import get_db
from apps.api.app.models.image import Image
from apps.api.app.schemas.search import SearchRequest
from apps.api.app.services.search_service import search_service
from ml.retrieval import get_bm25_retriever, get_vector_retriever
from ml.embeddings import get_embedding_service
from ml.evaluation.benchmark import MLEvaluationBenchmark
from apps.api.app.core.logging import logger

router = APIRouter(prefix="/evaluation", tags=["evaluation"])
benchmark_suite = MLEvaluationBenchmark()

@router.get("/results")
def get_evaluation_results():
    """Retrieve pre-computed ML evaluation benchmarks."""
    results = benchmark_suite.load_results()
    if not results:
        # Return default benchmark snapshot if benchmark has not been executed yet
        return {
            "status": "pending_execution",
            "message": "Benchmark has not been run yet. Trigger POST /api/v1/evaluation/run or run CLI 'python -m app.cli evaluate'",
            "benchmark_data": []
        }
    return results

@router.post("/run")
async def run_evaluation(db: Session = Depends(get_db)):
    """
    Execute ML Evaluation benchmark across 5 distinct information retrieval strategies:
    1. Filename Search
    2. OCR-only Search
    3. Image Embedding Search (Vector)
    4. Hybrid Search
    5. Hybrid + Re-ranking
    """
    # Load benchmark queries with ground truth
    benchmark_file = "./data/evaluation/benchmark_dataset.json"
    if not os.path.exists(benchmark_file):
        benchmark_file = "./data/evaluation/benchmark_queries.json"

    queries = []
    if os.path.exists(benchmark_file):
        try:
            with open(benchmark_file, "r") as f:
                queries = json.load(f)
        except Exception as e:
            logger.error(f"Error reading benchmark queries: {e}")

    images = db.query(Image).filter(Image.status == "completed").all()
    # If no custom dataset file, generate dynamic ground truth from current images
    if not queries and len(images) > 0:
        queries = generate_dynamic_benchmark_queries(images)

    if not queries:
        raise HTTPException(
            status_code=400,
            detail="Cannot run evaluation without indexed images or benchmark queries. Please index some images first."
        )

    # Strategy 1: Filename search
    def filename_retrieval(query_text: str):
        t0 = time.perf_counter()
        q_tokens = query_text.lower().split()
        matched = []
        for img in images:
            fn = img.original_name.lower()
            if any(t in fn for t in q_tokens if len(t) > 2):
                matched.append(img.id)
        latency = (time.perf_counter() - t0) * 1000
        return matched, latency

    # Strategy 2: OCR-only search
    bm25 = get_bm25_retriever()
    # Ensure BM25 in-memory index is up to date with completed images
    docs = []
    for img in images:
        ocr_text = img.ocr_result.text if img.ocr_result else ""
        docs.append({"image_id": img.id, "filename": img.original_name, "text": ocr_text, "tags": [img.mime_type]})
    bm25.build_index(docs)

    def ocr_retrieval(query_text: str):
        t0 = time.perf_counter()
        res = bm25.search(query_text, limit=10)
        latency = (time.perf_counter() - t0) * 1000
        return [r["image_id"] for r in res], latency

    # Strategy 3: Vector-only search
    embed_svc = get_embedding_service()
    vec_retriever = get_vector_retriever()
    def vector_retrieval(query_text: str):
        t0 = time.perf_counter()
        vec = embed_svc.embed_text(query_text)
        res = vec_retriever.search_similar(vec, limit=10)
        latency = (time.perf_counter() - t0) * 1000
        return [r["image_id"] for r in res], latency

    # Strategy 4: Hybrid Retrieval without Secondary Reranking
    async def hybrid_nofuse_runner(query_text: str):
        s_req = SearchRequest(query=query_text, search_mode="hybrid", enable_reranking=False, limit=10)
        res = await search_service.search(db, s_req)
        return [item.image.id for item in res.results], res.latency_ms

    # Strategy 5: Hybrid + Heuristic Signal Reranking
    async def hybrid_rerank_runner(query_text: str):
        s_req = SearchRequest(query=query_text, search_mode="hybrid", enable_reranking=True, limit=10)
        res = await search_service.search(db, s_req)
        return [item.image.id for item in res.results], res.latency_ms

    strategy_results = []
    strategy_results.append(benchmark_suite.evaluate_strategy("1. Filename Search", queries, filename_retrieval))
    strategy_results.append(benchmark_suite.evaluate_strategy("2. OCR-only Search", queries, ocr_retrieval))
    strategy_results.append(benchmark_suite.evaluate_strategy("3. Vector Embedding", queries, vector_retrieval))
    strategy_results.append(await benchmark_suite.evaluate_strategy_async("4. Hybrid Retrieval (Vector + BM25)", queries, hybrid_nofuse_runner))
    strategy_results.append(await benchmark_suite.evaluate_strategy_async("5. Hybrid + Signal Re-ranking", queries, hybrid_rerank_runner))

    benchmark_summary = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_queries": len(queries),
        "total_corpus_images": len(images),
        "results": strategy_results
    }

    benchmark_suite.save_results(benchmark_summary)
    return benchmark_summary

def generate_dynamic_benchmark_queries(images: List[Image]) -> List[Dict[str, Any]]:
    """Generates ground truth query-image pairs based on real OCR and filenames."""
    queries = []
    for img in images:
        ocr_text = img.ocr_result.text if img.ocr_result else ""
        words = [w for w in ocr_text.split() if len(w) > 4][:3]
        if words:
            query = " ".join(words)
            queries.append({
                "query": query,
                "relevant_image_ids": [img.id]
            })
        else:
            name_part = img.original_name.split(".")[0].replace("-", " ").replace("_", " ")
            if len(name_part) > 3:
                queries.append({
                    "query": name_part,
                    "relevant_image_ids": [img.id]
                })

    return queries[:25]
