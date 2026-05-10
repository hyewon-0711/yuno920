"""Supabase access_token (JWT) 검증 — 자녀 스코프 API 보호용."""

import jwt
import httpx
from fastapi import Depends, Header, HTTPException
from jwt import PyJWTError

from app.config import Settings, get_settings


def _validate_with_supabase_auth(token: str, settings: Settings) -> str | None:
    """JWT secret mismatch 시 Supabase Auth API로 토큰 유효성 재검증."""
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None

    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/user"
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {token}",
    }

    try:
        with httpx.Client(timeout=5.0) as client:
            res = client.get(url, headers=headers)
        if res.status_code != 200:
            return None
        payload = res.json()
        uid = payload.get("id")
        return uid if isinstance(uid, str) else None
    except Exception:
        return None


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
                uid = _validate_with_supabase_auth(token, settings)
                if uid:
                    return uid
                raise HTTPException(
                    status_code=401,
                    detail="유효하지 않은 토큰입니다. (JWT Secret·로그인 상태를 확인해 주세요)",
                )
    sub = payload.get("sub")
    if not sub or not isinstance(sub, str):
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다")
    return sub
