# Architecture Decision Record (ADR) - VisualSearch Memory

## System Overview

VisualSearch Memory is a production-grade personal visual memory and multimodal search system. It allows users to store, index, and retrieve images, screenshots, code snippets, diagrams, notes, and documents using natural language queries, exact OCR matching, and visual similarity.

## Core Architectural Decisions

### 1. Why Qdrant Vector Database?
- **High Performance & Filtering**: Qdrant offers native HNSW indexing combined with rich payload filtering, allowing metadata constraints (date taken, mime type, collection, OCR flag) to be applied directly during the vector search phase without post-filtering overhead.
- **Embedded & Remote Dual-Mode**: Supports both remote clustering (`http://localhost:6333`) and zero-daemon embedded on-disk client (`QdrantClient(path=...)`), making local evaluation instant while maintaining enterprise cloud scale.

### 2. Why OpenCLIP?
- **Multimodal Visual & Text Alignment**: OpenCLIP aligns images and text into a shared 512-dimensional embedding space. Queries like *"AWS cloud diagram"* or *"Dijkstra algorithm"* project close to diagrammatic screenshots and code graphics.
- **Hardware Acceleration**: Automatically selects Apple Silicon Metal Performance Shaders (`mps`), NVIDIA CUDA, or CPU fallback.

### 3. Why Hybrid Search (Vector + BM25)?
- **Vector Blind Spots**: Dense vector embeddings excel at semantic concepts but can miss exact alphanumeric identifiers such as `API Gateway`, `DynamoDB`, `dijkstra`, `heapq`, or exact function names.
- **BM25 Lexical Precision**: BM25 indexes extracted OCR text and filenames for exact keyword recall.
- **Rank Fusion**: Combines scores using configurable weights:
  $$\text{Score} = w_{\text{sem}} \cdot S_{\text{vector}} + w_{\text{kw}} \cdot S_{\text{bm25}} + w_{\text{meta}} \cdot S_{\text{meta}}$$

### 4. Why Dual-Database (PostgreSQL + Qdrant)?
- **Relational Integrity**: PostgreSQL manages normalized transactional schemas, foreign keys, cascades, user accounts, and collections.
- **Specialized Vector Operations**: Vector databases are optimized for high-dimensional approximate nearest neighbors (ANN), whereas relational databases degrade significantly under heavy vector joins.

### 5. Local Privacy First
- All models (OpenCLIP, Tesseract OCR, Ollama LLM) execute on localhost. No private documents or screenshots are dispatched to external cloud APIs.
