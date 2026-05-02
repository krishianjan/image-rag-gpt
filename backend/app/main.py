from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import upload, documents, search, agent, reviews

app = FastAPI(title="IMAGE-OCR-GPT API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add /v1 prefix to match deployed backend
app.include_router(upload.router, prefix="/v1/upload", tags=["upload"])
app.include_router(documents.router, prefix="/v1/documents", tags=["documents"])
app.include_router(search.router, prefix="/v1/search", tags=["search"])
app.include_router(agent.router, prefix="/v1/agent", tags=["agent"])
app.include_router(reviews.router, prefix="/v1/reviews", tags=["reviews"])

@app.get("/")
def root():
    return {"message": "IMAGE-OCR-GPT API", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}