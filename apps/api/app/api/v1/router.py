from fastapi import APIRouter
from app.api.v1.endpoints import services, import_routes, registry, admin, console

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(services.router)
api_router.include_router(import_routes.router)
api_router.include_router(registry.router)
api_router.include_router(admin.router)
api_router.include_router(console.router)
