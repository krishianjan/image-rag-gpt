import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/reviews", tags=["reviews"])

class ReviewCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    role: str = Field(min_length=1, max_length=100)
    stars: int = Field(ge=1, le=5)
    review: str = Field(min_length=5, max_length=500)

class ReviewOut(ReviewCreate):
    id: str
    created_at: str

_store: list[dict] = [
    {"id": str(uuid.uuid4()), "name": "Sarah K.", "role": "Head of Ops · FinTech", "stars": 5,
     "review": "Replaced our invoice data entry team's Monday work in 8 seconds.", "created_at": "2026-04-01T10:00:00Z"},
    {"id": str(uuid.uuid4()), "name": "Marcus L.", "role": "ML Engineer · AI Startup", "stars": 5,
     "review": "Was paying $0.40/image token with GPT-4V. DocuMind costs $0.003. Insane.", "created_at": "2026-04-05T14:00:00Z"},
    {"id": str(uuid.uuid4()), "name": "Priya R.", "role": "Founder · LegalTech", "stars": 5,
     "review": "Contract review used to take 3 days and $800. Now: upload, ask, done.", "created_at": "2026-04-10T09:00:00Z"},
]

@router.get("", response_model=list[ReviewOut])
async def list_reviews():
    return list(reversed(_store))

@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(body: ReviewCreate):
    review = {
        "id": str(uuid.uuid4()),
        "name": body.name, "role": body.role,
        "stars": body.stars, "review": body.review,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _store.append(review)
    return review