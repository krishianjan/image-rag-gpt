import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status
from jose import jwt
from sqlalchemy import select

from app.api.deps import DBDep
from app.config import settings
from app.models.documents import Tenant
from app.schemas.documents import TenantCreate, TenantOut, TokenOut

router = APIRouter(prefix="/auth", tags=["auth"])


def _make_token(tenant_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    return jwt.encode(
        {"tenant_id": str(tenant_id), "exp": expire},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


@router.post("/tenants", response_model=TenantOut, status_code=status.HTTP_201_CREATED)
async def create_tenant(body: TenantCreate, db: DBDep):
    tenant = Tenant(name=body.name)
    db.add(tenant)
    await db.flush()
    await db.refresh(tenant)
    return tenant


@router.post("/token", response_model=TokenOut)
async def get_token(tenant_id: uuid.UUID, db: DBDep):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id, Tenant.is_active == True))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
    return TokenOut(access_token=_make_token(tenant.id), tenant_id=tenant.id)
