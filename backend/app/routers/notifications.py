import json
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pywebpush import WebPushException, webpush

from app.auth_deps import get_current_user_id
from app.config import Settings, get_settings
from app.models.schemas import (
    PushSendResponse,
    PushSubscriptionRequest,
    PushUnsubscribeRequest,
)
from app.services.supabase_service import SupabaseService

router = APIRouter()
logger = logging.getLogger(__name__)


def _require_vapid(settings: Settings) -> None:
    if not settings.vapid_private_key or not settings.vapid_subject:
        raise HTTPException(status_code=503, detail="웹 푸시 서버 설정이 아직 완료되지 않았습니다")


def send_push_to_user(user_id: str, payload: dict[str, Any], settings: Settings | None = None) -> PushSendResponse:
    """Send one Web Push message to all of a user's registered browsers."""
    settings = settings or get_settings()
    _require_vapid(settings)
    db = SupabaseService()
    subscriptions = db.get_web_push_subscriptions(user_id)
    sent = 0
    removed = 0

    for subscription in subscriptions:
        subscription_info = {
            "endpoint": subscription["endpoint"],
            "keys": {
                "p256dh": subscription["p256dh"],
                "auth": subscription["auth"],
            },
        }
        try:
            webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload, ensure_ascii=False),
                vapid_private_key=settings.vapid_private_key,
                vapid_claims={"sub": settings.vapid_subject},
            )
            sent += 1
        except WebPushException as exc:
            status_code = getattr(getattr(exc, "response", None), "status_code", None)
            if status_code in (404, 410):
                db.delete_web_push_subscription_by_id(subscription["id"])
                removed += 1
            else:
                logger.warning("web push delivery failed for subscription %s: %s", subscription["id"], status_code or "unknown")
        except Exception:
            logger.exception("unexpected web push delivery failure for subscription %s", subscription["id"])

    return PushSendResponse(sent=sent, removed=removed)


@router.post("/push/subscribe")
def subscribe_push(
    request: PushSubscriptionRequest,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, bool]:
    SupabaseService().upsert_web_push_subscription(user_id, request.model_dump())
    return {"ok": True}


@router.post("/push/unsubscribe")
def unsubscribe_push(
    request: PushUnsubscribeRequest,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, bool]:
    SupabaseService().delete_web_push_subscription(user_id, request.endpoint)
    return {"ok": True}


@router.post("/push/test", response_model=PushSendResponse)
def send_test_push(
    settings: Settings = Depends(get_settings),
    user_id: str = Depends(get_current_user_id),
) -> PushSendResponse:
    result = send_push_to_user(
        user_id,
        {
            "title": "Yuno920 알림이 연결됐어요",
            "body": "앞으로 필요한 소식을 이곳에서 알려드릴게요.",
            "url": "/settings",
            "tag": "yuno920-test",
        },
        settings,
    )
    if result.sent == 0:
        raise HTTPException(status_code=400, detail="등록된 알림 기기가 없습니다. 먼저 알림을 켜주세요")
    return result
