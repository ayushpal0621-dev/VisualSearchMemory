# REST API Documentation

Base URL: `/api/v1`

## Endpoints

### 1. Images
- `POST /images/upload`: Upload single or multiple images (Multipart form: `files: File[]`). Returns background `IndexingJob`.
- `POST /images/import-directory`: Ingest local machine folder (Form data: `directory_path: string`).
- `POST /images/index`: Trigger re-indexing for pending/failed memories.
- `GET /images`: Paginated list of images with filters (`page`, `page_size`, `collection_id`, `status`).
- `GET /images/{id}`: Detailed image metadata, EXIF, and OCR bounding boxes.
- `GET /images/{id}/file`: Raw image stream for preview/render.
- `DELETE /images/{id}`: Delete image from DB, vector index, and optionally disk.

### 2. Search
- `POST /search`: Execute search query.
  ```json
  {
    "query": "AWS Lambda screenshots",
    "search_mode": "hybrid",
    "weights": { "semantic": 0.6, "keyword": 0.3, "metadata": 0.1 },
    "filters": { "collection_id": null, "similarity_threshold": 0.0 },
    "limit": 24
  }
  ```
- `POST /search/similar`: Retrieve visually similar images given `image_id`.
- `POST /search/conversation`: Multi-turn dialogue search preserving prior context.

### 3. Collections
- `GET /collections`: List collections with cover images and image counts.
- `POST /collections`: Create collection `{ "name": "...", "description": "...", "color": "..." }`.
- `PATCH /collections/{id}`: Update collection name/color.
- `DELETE /collections/{id}`: Delete collection.
- `POST /collections/{id}/images`: Add image IDs to collection.

### 4. Intelligence & Stats
- `GET /stats`: System overview stats (total images, indexed, storage in MB, OCR coverage, recent searches).
- `GET /stats/duplicates`: Detect exact (SHA-256) and near (pHash) duplicates.
- `GET /stats/clusters`: Thematic clusters with automatic labels.
- `POST /stats/clusters/run`: Trigger K-Means/DBSCAN re-clustering.
- `GET /timeline`: Chronological memory groups.
- `GET /jobs/{id}`: Live indexing job progress.

### 5. Evaluation
- `GET /evaluation/results`: Fetch persisted IR benchmark report.
- `POST /evaluation/run`: Run evaluation across the 5 search strategies.
