from fastapi import APIRouter

from app.api.v1.routes_feedback import router as feedback_router
from app.api.v1.routes_mixes import router as mixes_router

api_router = APIRouter(prefix="/v1")
api_router.include_router(mixes_router)
api_router.include_router(feedback_router)
