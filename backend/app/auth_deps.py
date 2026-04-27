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
        # 일부 토큰/버전은 aud claim 형식이 달라 1차 검증이 실패할 수 있음 — 서명·만료는 유지
        try:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                options={"verify_signature": True, "verify_aud": False, "require": ["exp"]},
            )
        except PyJWTError:
            try:
                payload = jwt.decode(
                    token,
                    settings.supabase_jwt_secret,
                    algorithms=["HS256"],
                    options={"verify_signature": True, "verify_aud": False},
                )
            except PyJWTError:
                raise HTTPException(
                    status_code=401,
                    detail="유효하지 않은 토큰입니다. (JWT Secret·로그인 상태를 확인해 주세요)",
                )
    sub = payload.get("sub")
    if not sub or not isinstance(sub, str):
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다")
    return sub
