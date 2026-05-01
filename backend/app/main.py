from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uuid
import os
from datetime import datetime, timedelta
import jwt

app = FastAPI(title="Image RAG GPT API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class TenantCreate(BaseModel):
    name: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# In-memory storage (temporary - replace with database)
tenants = {}
tokens = {}

JWT_SECRET = os.getenv("JWT_SECRET", "dev_secret_key_change_me")

# Auth endpoints
@app.post("/v1/auth/tenants")
async def create_tenant(tenant: TenantCreate):
    tenant_id = str(uuid.uuid4())
    tenants[tenant_id] = {"name": tenant.name, "created_at": datetime.now()}
    return {"tenant_id": tenant_id, "name": tenant.name}

@app.post("/v1/auth/token")
async def get_token(tenant_id: str):
    if tenant_id not in tenants:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Create JWT token
    payload = {
        "tenant_id": tenant_id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return {"access_token": token, "token_type": "bearer"}

@app.get("/v1/auth/verify")
async def verify_token(authorization: str = None):
    if not authorization:
        raise HTTPException(status_code=401, detail="No token provided")
    
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return {"valid": True, "tenant_id": payload.get("tenant_id")}
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/")
async def root():
    return {"message": "Image RAG GPT API is running"}

@app.get("/health")
async def health():
    return {"status": "ok"}
