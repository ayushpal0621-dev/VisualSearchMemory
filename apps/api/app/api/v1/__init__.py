from fastapi import APIRouter
from apps.api.app.api.v1.images import router as images_router
from apps.api.app.api.v1.search import router as search_router
from apps.api.app.api.v1.collections import router as collections_router
from apps.api.app.api.v1.timeline import router as timeline_router
from apps.api.app.api.v1.stats import router as stats_router
from apps.api.app.api.v1.jobs import router as jobs_router
from apps.api.app.api.v1.evaluation import router as evaluation_router

api_router = APIRouter()
api_router.include_router(images_router)
api_router.include_router(search_router)
api_router.include_router(collections_router)
api_router.include_router(timeline_router)
api_router.include_router(stats_router)
api_router.include_router(jobs_router)
api_router.include_router(evaluation_router)

__all__ = ["api_router"]
