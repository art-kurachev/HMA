from fastapi import APIRouter

from app.api.v1.routes_admin import router as admin_router
from app.api.v1.routes_feedback import router as feedback_router
from app.api.v1.routes_mixes import router as mixes_router
from app.api.v1.routes_notify import router as notify_router
# Полка по фото (GigaChat vision) — временно отключено; см. README.
# from app.api.v1.routes_shelf import router as shelf_router
from app.api.v1.routes_shopping_list import router as shopping_list_router
from app.api.v1.routes_stars import router as stars_router

api_router = APIRouter(prefix="/v1")
api_router.include_router(mixes_router)
api_router.include_router(stars_router)
api_router.include_router(notify_router)
api_router.include_router(feedback_router)
api_router.include_router(shopping_list_router)
# api_router.include_router(shelf_router)
api_router.include_router(admin_router)
