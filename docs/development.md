# Local Development Guide

## Prerequisites
- macOS (arm64) or Linux
- Python 3.11+
- Node.js 20+ and npm
- Tesseract OCR (`brew install tesseract` or `apt install tesseract-ocr`)

## Quickstart

### 1. Environment Setup
```bash
git clone <repo-url>
cd VSM
cp .env.example .env
make install
```

### 2. Generate Sample Memories & Seed Index
```bash
make sample-data
```

### 3. Start Backend & Frontend
Terminal 1 (Backend):
```bash
make dev-api
```
The FastAPI documentation is accessible at `http://localhost:8000/docs`.

Terminal 2 (Frontend):
```bash
make dev-web
```
The Next.js application will be available at `http://localhost:3000`.

### 4. Running Tests
```bash
make test
```

### 5. Docker Deployment
```bash
make docker-up
```
Starts PostgreSQL, Qdrant, Redis, Ollama, FastAPI backend, and Next.js frontend.
