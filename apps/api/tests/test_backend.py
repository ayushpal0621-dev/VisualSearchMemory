import pytest
import os
import shutil
import tempfile
from pathlib import Path

# Isolate test Qdrant storage before loading settings/retriever
TEST_QDRANT_DIR = tempfile.mkdtemp(prefix="test_qdrant_")
os.environ["QDRANT_STORAGE_PATH"] = TEST_QDRANT_DIR

import numpy as np
from PIL import Image

from apps.api.app.core.config import settings
from apps.api.app.core.database import init_db, SessionLocal, Base, engine
from apps.api.app.models.image import Image as DBImage
from apps.api.app.services.image_service import image_service
from apps.api.app.services.indexing_pipeline import indexing_pipeline
from apps.api.app.services.search_service import search_service
from apps.api.app.services.duplicate_service import duplicate_service
from apps.api.app.schemas.search import SearchRequest, SimilarImageRequest
from ml.embeddings import get_embedding_service
from ml.ocr import get_ocr_service
from ml.retrieval import get_vector_retriever, get_bm25_retriever
from ml.clustering import get_clustering_service
from ml.evaluation.benchmark import MLEvaluationBenchmark

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    # Initialize DB
    init_db()
    yield

def test_embedding_service():
    embed_svc = get_embedding_service()
    dim = embed_svc.dimension
    assert dim == 512

    # Test text embedding
    v_text = embed_svc.embed_text("AWS Lambda Cloud Architecture")
    assert len(v_text) == 512
    norm = np.linalg.norm(v_text)
    assert pytest.approx(norm, abs=1e-2) == 1.0

    # Test image embedding
    sample_img_path = "./data/sample/aws-serverless-architecture.png"
    v_img = embed_svc.embed_image(sample_img_path)
    assert len(v_img) == 512
    norm_img = np.linalg.norm(v_img)
    assert pytest.approx(norm_img, abs=1e-2) == 1.0

def test_ocr_service():
    ocr_svc = get_ocr_service()
    sample_img_path = "./data/sample/aws-serverless-architecture.png"
    res = ocr_svc.extract_text(sample_img_path)
    assert "text" in res
    assert "confidence" in res
    assert "bounding_boxes" in res

def test_image_indexing_and_qdrant():
    db = SessionLocal()
    sample_img_path = Path("./data/sample/aws-serverless-architecture.png")

    with open(sample_img_path, "rb") as f:
        content = f.read()

    file_meta = image_service.save_uploaded_file(content, sample_img_path.name)
    img = DBImage(
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

    success = indexing_pipeline.index_image_sync(db, img.id)
    assert success is True

    db.refresh(img)
    assert img.status == "completed"
    assert img.ocr_result is not None

    # Check vector stored in Qdrant
    vector_retriever = get_vector_retriever()
    stored_vec = vector_retriever.get_vector(img.id)
    assert stored_vec is not None
    assert len(stored_vec) == 512

    db.close()

def test_bm25_retriever():
    bm25 = get_bm25_retriever()
    docs = [
        {"image_id": "doc-1", "filename": "aws-lambda.png", "text": "AWS Lambda Serverless DynamoDB S3", "tags": []},
        {"image_id": "doc-2", "filename": "python-code.png", "text": "def dijkstra graph distances heapq", "tags": []}
    ]
    bm25.build_index(docs)

    res = bm25.search("DynamoDB")
    assert len(res) > 0
    assert res[0]["image_id"] == "doc-1"
    assert "dynamodb" in [t.lower() for t in res[0]["matched_terms"]]

@pytest.mark.asyncio
async def test_search_service_hybrid():
    db = SessionLocal()
    # Refresh BM25 index with current DB items
    indexing_pipeline.refresh_bm25_index(db)

    req = SearchRequest(query="AWS Lambda", search_mode="hybrid", limit=5)
    resp = await search_service.search(db, req)

    assert resp.query == "AWS Lambda"
    assert resp.search_mode == "hybrid"
    assert resp.latency_ms > 0
    if resp.results:
        first = resp.results[0]
        assert first.score > 0.0
        assert len(first.signals.explanation_reasons) > 0

    db.close()

def test_duplicate_detection():
    db = SessionLocal()
    # Index both red car and its copy
    car_orig = Path("./data/sample/red-sports-car-photo.jpg")
    car_copy = Path("./data/sample/red-sports-car-photo-copy.jpg")

    for p in [car_orig, car_copy]:
        with open(p, "rb") as f:
            content = f.read()
        file_meta = image_service.save_uploaded_file(content, p.name)
        img = DBImage(
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

    duplicates = duplicate_service.find_duplicates(db)
    assert len(duplicates) >= 1
    # Check that exact duplicate was detected
    exact_dups = [d for d in duplicates if d.type == "exact"]
    assert len(exact_dups) >= 1
    assert len(exact_dups[0].images) >= 2

    db.close()

def test_clustering_service():
    clustering_svc = get_clustering_service()
    images_data = [
        {"image_id": "1", "vector": [0.1]*512, "filename": "aws-cloud.png", "ocr_text": "AWS Lambda Serverless"},
        {"image_id": "2", "vector": [0.12]*512, "filename": "aws-arch.png", "ocr_text": "Amazon S3 DynamoDB"},
        {"image_id": "3", "vector": [-0.5]*512, "filename": "python-algo.png", "ocr_text": "def dijkstra shortest path"}
    ]
    clusters = clustering_svc.run_clustering(images_data, algorithm="kmeans", n_clusters=2)
    assert len(clusters) == 2
    for c in clusters:
        assert "label" in c
        assert "image_count" in c
        assert len(c["top_keywords"]) > 0

def test_ml_evaluation_metrics():
    retrieved = ["img-1", "img-2", "img-3", "img-4", "img-5"]
    ground_truth = {"img-1", "img-3"}

    p5 = MLEvaluationBenchmark.precision_at_k(retrieved, ground_truth, 5)
    assert p5 == 2.0 / 5.0

    r5 = MLEvaluationBenchmark.recall_at_k(retrieved, ground_truth, 5)
    assert r5 == 2.0 / 2.0

    mrr = MLEvaluationBenchmark.reciprocal_rank(retrieved, ground_truth)
    assert mrr == 1.0 / 1.0  # img-1 is at rank 1
