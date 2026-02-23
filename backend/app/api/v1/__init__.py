from fastapi import APIRouter

from app.api.v1.routes_admin import router as admin_router
from app.api.v1.routes_feedback import router as feedback_router
from app.api.v1.routes_mixes import router as mixes_router
from app.api.v1.routes_notify import router as notify_router

api_router = APIRouter(prefix="/v1")
api_router.include_router(mixes_router)
api_router.include_router(notify_router)
api_router.include_router(feedback_router)
api_router.include_router(admin_router)
