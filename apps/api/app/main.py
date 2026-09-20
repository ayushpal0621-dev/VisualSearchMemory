from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path

from apps.api.app.core.config import settings
from apps.api.app.core.database import init_db, SessionLocal
from apps.api.app.core.logging import logger
from apps.api.app.api.v1 import api_router
from apps.api.app.services.indexing_pipeline import indexing_pipeline

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure DB schema initialized & BM25 index built
    logger.info(f"Starting {settings.PROJECT_NAME} API backend...")
    init_db()
    db = SessionLocal()
    try:
        indexing_pipeline.refresh_bm25_index(db)
    except Exception as e:
        logger.error(f"Error building startup BM25 index: {e}")
    finally:
        db.close()
    yield
    # Shutdown
    logger.info("Shutting down API backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
    description="Production-grade AI-powered personal visual memory and multimodal semantic search system."
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "An unexpected internal server error occurred. Please try again later.", "detail": str(exc) if settings.DEBUG else None}
    )

# Include v1 API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database": "connected",
        "qdrant_storage": settings.QDRANT_STORAGE_PATH,
        "embedding_model": settings.EMBEDDING_MODEL
    }

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.app.main:app", host="0.0.0.0", port=8000, reload=True)
