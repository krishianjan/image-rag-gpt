from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, documents, upload, search, agent, reviews


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.database import engine
    from app.models import Base
    async with engine.begin() as conn:
        pass
    yield
    await engine.dispose()


app = FastAPI(
    title="Image GPT for OCR API",
    version="1.0.0",
    description="Cardinal-compatible document intelligence API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3003", "http://localhost:5173", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/v1")
app.include_router(upload.router, prefix="/v1")
app.include_router(documents.router, prefix="/v1")
app.include_router(search.router, prefix="/v1")
app.include_router(agent.router, prefix="/v1")
app.include_router(reviews.router, prefix="/v1")


@app.get("/health")
async def health():
    from app.database import engine
    from app.config import settings
    import redis as redis_lib
    db_ok, redis_ok = True, True
    try:
        async with engine.connect() as conn:
            from sqlalchemy import text
            await conn.execute(text("SELECT 1"))
    except Exception:
        db_ok = False
    try:
        r = redis_lib.from_url(settings.REDIS_URL)
        r.ping()
        r.close()
    except Exception:
        redis_ok = False
    return {"status": "ok" if db_ok and redis_ok else "degraded", "db": db_ok, "redis": redis_ok}