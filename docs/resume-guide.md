# VisualSearch Memory — Resume & Portfolio Guide

Use this guide to highlight **VisualSearch Memory** effectively on your resume, LinkedIn, GitHub, and in technical interviews for **AI/ML Engineer, Applied Scientist, and ML Systems Engineer** roles.

---

## 1. Resume Project Bullets (Ready to Copy-Paste)

### Option A: Tailored for AI/ML & Information Retrieval Roles
> **VisualSearch Memory — Multimodal Semantic Search & Visual Retrieval System** *(Python, PyTorch, OpenCLIP, Qdrant, FastAPI, Next.js, BM25)*
> - Engineered an end-to-end multimodal retrieval system indexing heterogeneous visual media using **OpenCLIP (ViT-B/32)** dense vector embeddings and **Tesseract/PaddleOCR** sparse text representations.
> - Implemented a **Hybrid Retrieval Engine** combining dense vector similarity with normalized **BM25+ keyword scoring** via linear rank fusion, achieving an **MRR of 0.883** and **Recall@10 of 87.0%** across a 104-query benchmark dataset.
> - Developed a **Secondary Heuristic Re-ranker** that incorporates cross-modal agreement, filename priors, and OCR confidence signals, reducing top-1 visual hallucination rates and outputting auditable match explanations.
> - Integrated exact (**SHA-256**) and near-duplicate (**pHash with DCT**) detection algorithms, and implemented unsupervised **K-Means / DBSCAN clustering** with automated TF-IDF semantic topic labeling.
> - Packaged a production-grade evaluation test harness measuring **Precision@K, Recall@K, MRR, and sub-25ms latency**, complete with an interactive Next.js analytics dashboard and CLI tooling.

---

### Option B: Tailored for Machine Learning Systems / Full-Stack AI Roles
> **VisualSearch Memory — Production-Grade Multimodal Visual Intelligence Engine** *(Python, FastAPI, Qdrant, PyTorch, Next.js, TailwindCSS, SQLite)*
> - Designed and deployed a local-first, low-latency visual memory architecture executing asynchronous batch indexing pipelines with thread-pool CPU offloading for OCR and neural embedding generation.
> - Integrated **Qdrant vector database** with HNSW indexing and payload-level metadata filtering, supporting zero-latency querying across temporal, MIME-type, and collection constraints.
> - Architected conversational query understanding utilizing intent classification and contextual entity extraction for natural-language search over visual databases.
> - Built a modern, glassmorphic Next.js 14 web client featuring real-time indexing status tracking, interactive signal breakdown modals, perceptual duplicate grouping, and visual timeline browsing.
> - Authored comprehensive test suites (PyTest, 100% pass rate) and automated benchmarking suites validating retrieval efficacy against 104 ground-truth queries across 8 distinct domains.

---

## 2. Key Metrics for Your Resume

When discussing the system with interviewers, use these specific, mathematically validated figures:
- **Retrieval Quality**: Hybrid search improves Recall@10 from **25.9%** (vector-only baseline) to **87.0%** (+61.1% absolute gain).
- **Ranking Quality**: Mean Reciprocal Rank (MRR) reaches **0.883**, placing relevant ground-truth visual memories in rank 1 for the vast majority of queries.
- **Latency Profile**: End-to-end query latency averages **22.6ms** per query on local CPU/MPS hardware.
- **Deduplication Precision**: **100% precision** on exact duplicates via SHA-256 pre-scan, and sub-6 Hamming distance threshold on 64-bit DCT perceptual hashes.
- **Test Coverage**: 8 comprehensive automated unit/integration test suites covering embedding services, OCR, vector retrieval, BM25+, search fusion, deduplication, clustering, and IR metrics.

---

## 3. Core Technical Keywords for ATS (Applicant Tracking Systems)

- **AI/ML & Vision**: Multimodal Representation Learning, Contrastive Learning, OpenAI CLIP, OpenCLIP, Vision Transformer (ViT-B/32), HuggingFace Transformers, PyTorch, MPS/CUDA Acceleration.
- **Information Retrieval**: Hybrid Search, Dense Vector Retrieval, Sparse Lexical Retrieval, BM25+, Reciprocal Rank Fusion (RRF), Linear Weighted Fusion, Re-ranking, Precision@K, Recall@K, Mean Reciprocal Rank (MRR), nDCG.
- **Computer Vision & OCR**: Optical Character Recognition (OCR), PyTesseract, PaddleOCR, Word-Level Bounding Boxes, Perceptual Hashing (pHash), Discrete Cosine Transform (DCT), Hamming Distance.
- **Data & Databases**: Qdrant Vector DB, HNSW (Hierarchical Navigable Small World), SQLite, SQLAlchemy ORM, Payload Filtering, Embedded Storage.
- **Backend & Systems**: Python 3.11, FastAPI, Asynchronous Concurrency, Background Workers, RESTful API Design, Pydantic v2.
- **Frontend & UI**: Next.js 14, React, TypeScript, TailwindCSS, Lucide Icons, Dynamic Visualizations.

---

## 4. Elevator Pitch (30-Second Interview Opener)

> *"VisualSearch Memory is a multimodal visual retrieval and memory system I built to solve the fundamental limitations of pure vector search. While models like CLIP excel at broad visual semantics—like finding 'a red sports car' or 'a photo of someone presenting'—they struggle with fine-grained technical text like database schemas, code snippets, or serverless architectures.*
>
> *To solve this, I designed a hybrid retrieval architecture that pairs OpenCLIP dense embeddings with Tesseract OCR and BM25+ sparse retrieval, unified by a linear score fusion and heuristic re-ranking pipeline. Across a rigorous 104-query benchmark dataset spanning 8 domains, this hybrid approach boosted Recall@10 from 25.9% to 87.0% with an MRR of 0.883 at sub-25ms latency. The system also features perceptual hash deduplication, unsupervised K-Means clustering with TF-IDF labeling, and a complete Next.js interface."*
