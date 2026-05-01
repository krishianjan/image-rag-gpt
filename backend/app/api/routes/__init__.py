from fastapi import APIRouter
from app.api.routes import agent, auth, documents, search, upload, extraction

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(upload.router)
api_router.include_router(documents.router)
api_router.include_router(search.router)
api_router.include_router(agent.router)
api_router.include_router(extraction.router)