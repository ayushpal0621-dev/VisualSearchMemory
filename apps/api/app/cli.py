import sys
import os
import argparse
import asyncio
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Lazy imports are used in command handlers to avoid eager resource locks

def run_index(directory: str):
    """Index an entire directory from CLI."""
    from apps.api.app.core.database import init_db, SessionLocal
    from apps.api.app.models.image import Image
    from apps.api.app.services.image_service import image_service
    from apps.api.app.services.indexing_pipeline import indexing_pipeline

    dir_path = Path(directory).resolve()
    if not dir_path.exists() or not dir_path.is_dir():
        print(f"Error: Directory {directory} does not exist.")
        return

    print(f"Scanning directory: {dir_path}")
    init_db()
    db = SessionLocal()
    image_extensions = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    files = [p for p in dir_path.rglob("*") if p.is_file() and p.suffix.lower() in image_extensions]
    print(f"Found {len(files)} candidate images.")

    for idx, p in enumerate(files, start=1):
        print(f"[{idx}/{len(files)}] Processing {p.name}...")
        try:
            with open(p, "rb") as f:
                content = f.read()
            file_meta = image_service.save_uploaded_file(content, p.name)
            img = Image(
                id=file_meta["id"],
                filename=file_meta["filename"],
                original_name=file_meta["original_name"],
                file_path=file_meta["file_path"],
                mime_type=file_meta["mime_type"],
                file_size=file_meta["file_size"],
                width=file_meta["width"],
                height=file_meta["height"],
                file_hash=file_meta["file_hash"],
                phash=file_meta["phash"],
                status="pending"
            )
            db.add(img)
            db.commit()
            indexing_pipeline.index_image_sync(db, img.id)
        except Exception as e:
            print(f"  Failed: {e}")

    indexing_pipeline.refresh_bm25_index(db)
    db.close()
    print("Indexing completed successfully.")

def run_search(query: str, mode: str = "hybrid"):
    """Search visual memory from CLI."""
    import urllib.request
    import json

    print(f"\n--- VisualSearch Memory CLI: Searching for \"{query}\" (mode: {mode}) ---")
    server_running = False
    try:
        health_req = urllib.request.Request("http://localhost:8000/health", method="GET")
        with urllib.request.urlopen(health_req, timeout=2) as resp:
            if resp.status == 200:
                server_running = True
    except Exception:
        server_running = False

    if server_running:
        req_data = json.dumps({"query": query, "search_mode": mode, "limit": 10}).encode("utf-8")
        req = urllib.request.Request(
            "http://localhost:8000/api/v1/search",
            data=req_data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            results = data.get("results", [])
            print(f"Retrieved {len(results)} images in {data.get('latency_ms', 0)}ms:\n")
            for rank, item in enumerate(results, start=1):
                img = item["image"]
                sig = item.get("signals", {})
                score_pct = int(item.get("score", 0) * 100)
                print(f"{rank}. [{score_pct}%] {img['original_name']} (ID: {img['id']})")
                print(f"   Signals: Semantic={sig.get('semantic_score', 0):.4f}, Keyword={sig.get('keyword_score', 0):.4f}")
                if sig.get("explanation_reasons"):
                    print(f"   Reasons: {'; '.join(sig['explanation_reasons'])}")
                if img.get("ocr") and img["ocr"].get("text"):
                    snippet = img["ocr"]["text"].replace("\n", " ")[:80]
                    print(f"   OCR: \"{snippet}...\"")
                print()
    else:
        from apps.api.app.core.database import init_db, SessionLocal
        from apps.api.app.services.indexing_pipeline import indexing_pipeline
        from apps.api.app.services.search_service import search_service
        from apps.api.app.schemas.search import SearchRequest
        init_db()
        db = SessionLocal()
        indexing_pipeline.refresh_bm25_index(db)
        req = SearchRequest(query=query, search_mode=mode, limit=10)
        res = asyncio.run(search_service.search(db, req))
        print(f"Retrieved {res.total_found} images in {res.latency_ms}ms:\n")
        for rank, item in enumerate(res.results, start=1):
            img = item.image
            signals = item.signals
            print(f"{rank}. [{int(item.score * 100)}%] {img.original_name} (ID: {img.id})")
            print(f"   Signals: Semantic={signals.semantic_score}, Keyword={signals.keyword_score}")
            if signals.explanation_reasons:
                print(f"   Reasons: {'; '.join(signals.explanation_reasons)}")
            if img.ocr and img.ocr.text:
                snippet = img.ocr.text.replace("\n", " ")[:80]
                print(f"   OCR: \"{snippet}...\"")
            print()
        db.close()

def run_evaluate():
    """Run ML evaluation benchmark suite from CLI."""
    from ml.evaluation.run import main as run_eval_main
    run_eval_main()

def run_cluster():
    """Run K-Means clustering and print semantic labels."""
    from apps.api.app.core.database import init_db, SessionLocal
    init_db()
    db = SessionLocal()
    from apps.api.app.api.v1.stats import run_clusters_job
    clusters = run_clusters_job(db=db, n_clusters=4)
    print(f"\nDiscovered {len(clusters)} visual clusters:\n")
    for c in clusters:
        print(f"Cluster #{c.cluster_id}: \"{c.label}\" ({c.image_count} images)")
        print(f"  Keywords: {', '.join(c.top_keywords)}")
    db.close()

def run_duplicates():
    """Detect and display duplicate images."""
    from apps.api.app.core.database import init_db, SessionLocal
    from apps.api.app.services.duplicate_service import duplicate_service
    init_db()
    db = SessionLocal()
    dups = duplicate_service.find_duplicates(db)
    print(f"\nFound {len(dups)} duplicate image clusters:\n")
    for d in dups:
        print(f"[{d.type.upper()}] Similarity: {d.similarity_score}")
        for im in d.images:
            print(f"  - {im['original_name']} ({im['id']})")
    db.close()

def main():
    parser = argparse.ArgumentParser(description="VisualSearch Memory CLI")
    subparsers = parser.add_subparsers(dest="command")

    # index
    index_parser = subparsers.add_parser("index", help="Index images from directory")
    index_parser.add_argument("directory", type=str, help="Path to image directory")

    # search
    search_parser = subparsers.add_parser("search", help="Search images")
    search_parser.add_argument("query", type=str, help="Search query")
    search_parser.add_argument("--mode", type=str, default="hybrid", choices=["semantic", "ocr", "hybrid"])

    # evaluate
    subparsers.add_parser("evaluate", help="Run ML retrieval benchmark")

    # cluster
    subparsers.add_parser("cluster", help="Run image clustering")

    # find-duplicates
    subparsers.add_parser("find-duplicates", help="Find exact and near duplicate images")

    args = parser.parse_args()

    if args.command == "index":
        run_index(args.directory)
    elif args.command == "search":
        run_search(args.query, args.mode)
    elif args.command == "evaluate":
        run_evaluate()
    elif args.command == "cluster":
        run_cluster()
    elif args.command == "find-duplicates":
        run_duplicates()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
