"""FastAPI dependencies: Supabase JWT (HS256) + DB service."""

import jwt
from jwt.exceptions import InvalidTokenError
from fastapi import Depends, HTTPException, Header
from functools import lru_cache

from app.config import get_settings
from app.services.supabase_service import SupabaseService


async def get_current_user_id(authorization: str | None = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization[7:].strip()
    settings = get_settings()
    if not settings.supabase_jwt_secret:
        raise HTTPException(status_code=500, detail="Server missing SUPABASE_JWT_SECRET")
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            leeway=120,
        )
    except InvalidTokenError:
        # 일부 환경에서 aud 클레임이 다를 수 있음 (서명은 동일 비밀로 검증)
        try:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
                leeway=120,
            )
        except InvalidTokenError:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token. backend .env 의 SUPABASE_JWT_SECRET이 대시보드 JWT Secret과 일치하는지 확인하세요.",
            ) from None
    uid = payload.get("sub")
    if not uid or not isinstance(uid, str):
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return uid


@lru_cache
def get_supabase_service() -> SupabaseService:
    return SupabaseService()


async def get_db() -> SupabaseService:
    return get_supabase_service()


def require_child_read(db: SupabaseService, user_id: str, child_id: str) -> None:
    r = db.client.table("family_members").select("id").eq("user_id", user_id).eq("child_id", child_id).limit(1).execute()
    if not r.data:
        raise HTTPException(status_code=403, detail="No access to this child")


def require_child_write(db: SupabaseService, user_id: str, child_id: str) -> None:
    r = (
        db.client.table("family_members")
        .select("role")
        .eq("user_id", user_id)
        .eq("child_id", child_id)
        .limit(1)
        .execute()
    )
    if not r.data:
        raise HTTPException(status_code=403, detail="No access to this child")
    if r.data[0].get("role") not in ("admin", "editor"):
        raise HTTPException(status_code=403, detail="Read-only access")
