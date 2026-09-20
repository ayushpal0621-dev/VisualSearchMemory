#!/usr/bin/env python3
"""
ML Evaluation Suite Runner for VisualSearch Memory.
Executes benchmarking across 5 retrieval strategies against benchmark_dataset.json:
1. Filename Search (Exact / Substring Lexical)
2. OCR-only BM25+ Retrieval
3. Multimodal Vector Search (OpenCLIP ViT-B-32)
4. Hybrid Retrieval (Linear Score Fusion: Vector + BM25)
5. Hybrid + Heuristic Signal Re-ranking

Usage:
  python -m ml.evaluation.run
"""

import sys
import os
import json
import time
import urllib.request
import urllib.error
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

def print_ascii_table(benchmark_data: dict):
    """Render a clean, publication-ready ASCII table of ML IR metrics."""
    results = benchmark_data.get("results", [])
    total_q = benchmark_data.get("total_queries", 0)
    total_imgs = benchmark_data.get("total_corpus_images", 0)
    ts = benchmark_data.get("timestamp", time.strftime("%Y-%m-%dT%H:%M:%SZ"))

    print("\n" + "=" * 106)
    print(f"   VISUALSEARCH MEMORY — MULTIMODAL INFORMATION RETRIEVAL BENCHMARK")
    print(f"   Corpus Size: {total_imgs} images | Benchmark Queries: {total_q} | Executed: {ts}")
    print("=" * 106)
    header = f"{'Retrieval Strategy':<38} | {'P@5':<7} | {'P@10':<7} | {'R@5':<7} | {'R@10':<7} | {'MRR':<7} | {'Latency':<9}"
    print(header)
    print("-" * 106)

    for r in results:
        strat = r["strategy"]
        p5 = f"{r['precision_at_5']:.4f}"
        p10 = f"{r['precision_at_10']:.4f}"
        r5 = f"{r['recall_at_5']:.4f}"
        r10 = f"{r['recall_at_10']:.4f}"
        mrr = f"{r['mrr']:.4f}"
        lat = f"{r['avg_latency_ms']:.2f} ms"
        print(f"{strat:<38} | {p5:<7} | {p10:<7} | {r5:<7} | {r10:<7} | {mrr:<7} | {lat:<9}")

    print("-" * 106)
    print("Metrics Definition:")
    print("  * P@K (Precision@K) : Proportion of top-K results that are relevant to the query.")
    print("  * R@K (Recall@K)    : Proportion of all relevant ground-truth images retrieved in top-K.")
    print("  * MRR (Mean RR)     : Average reciprocal rank (1/rank) of the first relevant retrieved document.")
    print("  * Latency           : End-to-end retrieval and scoring wall-clock time per query.")
    print("=" * 106 + "\n")

def run_via_api() -> dict:
    """Trigger evaluation via active FastAPI dev server."""
    api_url = "http://localhost:8000/api/v1/evaluation/run"
    req = urllib.request.Request(api_url, data=b"{}", headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))

def run_local() -> dict:
    """Run evaluation in-process using direct database and model handles."""
    import asyncio
    from apps.api.app.core.database import SessionLocal, init_db
    from apps.api.app.api.v1.evaluation import run_evaluation
    init_db()
    db = SessionLocal()
    try:
        results = asyncio.run(run_evaluation(db))
        return results
    finally:
        db.close()

def main():
    print("[1/2] Connecting to VisualSearch Memory evaluation engine...")
    server_running = False
    try:
        health_req = urllib.request.Request("http://localhost:8000/health", method="GET")
        with urllib.request.urlopen(health_req, timeout=3) as resp:
            if resp.status == 200:
                server_running = True
    except Exception:
        server_running = False

    if server_running:
        print("[2/2] Running benchmark across 104 queries via active FastAPI server...")
        try:
            results = run_via_api()
        except Exception as e:
            print(f"API run failed ({e}), falling back to direct local execution...")
            results = run_local()
    else:
        print("[2/2] Running benchmark in-process...")
        results = run_local()

    print_ascii_table(results)
    out_path = Path("./data/evaluation/benchmark_results.json")
    print(f"Benchmark results successfully saved to: {out_path.resolve()}\n")

if __name__ == "__main__":
    main()
