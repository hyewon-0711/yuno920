"""Supabase access_token (JWT) 검증 — 자녀 스코프 API 보호용."""

import jwt
from fastapi import Depends, Header, HTTPException
from jwt import PyJWTError

from app.config import Settings, get_settings


def get_current_user_id(
    authorization: str | None = Header(None, alias="Authorization"),
    settings: Settings = Depends(get_settings),
) -> str:
    if not settings.supabase_jwt_secret:
        raise HTTPException(
            status_code=503,
            detail="SUPABASE_JWT_SECRET is not set on the server",
        )
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")
    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except PyJWTError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다")
    sub = payload.get("sub")
    if not sub or not isinstance(sub, str):
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다")
    return sub
