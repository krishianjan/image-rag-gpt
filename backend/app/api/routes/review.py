import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, status
from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID

router = APIRouter(prefix="/reviews", tags=["reviews"])


class ReviewCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    role: str = Field(min_length=1, max_length=100)
    stars: int = Field(ge=1, le=5)
    review: str = Field(min_length=10, max_length=500)


class ReviewOut(BaseModel):
    id: str
    name: str
    role: str
    stars: int
    review: str
    created_at: str


# In-memory store for Phase 1 (replace with DB model in Phase 2)
_reviews: list[dict[str, Any]] = [
    {
        "id": str(uuid.uuid4()),
        "name": "Sarah K.",
        "role": "Head of Ops · FinTech Startup",
        "stars": 5,
        "review": "Replaced our entire invoice data entry team's Monday morning work in 8 seconds.",
        "created_at": "2026-04-01T10:00:00Z",
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Marcus L.",
        "role": "ML Engineer · AI Startup",
        "stars": 5,
        "review": "I was paying $0.40 per image token with GPT-4V. DocuMind costs $0.003. Game changer.",
        "created_at": "2026-04-05T14:00:00Z",
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Priya R.",
        "role": "Founder · LegalTech",
        "stars": 5,
        "review": "Contract review used to take 3 days and $800. Now I upload, ask questions, done.",
        "created_at": "2026-04-10T09:00:00Z",
    },
]


@router.get("", response_model=list[ReviewOut])
async def get_reviews():
    return list(reversed(_reviews))


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(body: ReviewCreate):
    review = {
        "id": str(uuid.uuid4()),
        "name": body.name,
        "role": body.role,
        "stars": body.stars,
        "review": body.review,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _reviews.append(review)
    return review