"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { postWithAuth } from "@/lib/api";
import { getPushSubscription, isPushSupported, subscribeToPush } from "@/lib/push";
import styles from "./PushNotificationSettings.module.css";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

type SendResponse = { sent: number; removed: number };

export default function PushNotificationSettings() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setSupported(isPushSupported());
    if (!isPushSupported()) return;
    getPushSubscription().then((subscription) => {
      if (!cancelled) setEnabled(Boolean(subscription));
    }).catch(() => {
      if (!cancelled) setEnabled(false);
    });
    return () => { cancelled = true; };
  }, []);

  const enable = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const subscription = await subscribeToPush(publicKey);
      await postWithAuth("/api/notifications/push/subscribe", subscription);
      setEnabled(true);
      setMessage("이 기기에서 Yuno920 알림을 받을 수 있어요.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "알림 설정을 저장하지 못했습니다");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const subscription = await getPushSubscription();
      if (subscription) {
        await postWithAuth("/api/notifications/push/unsubscribe", { endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setEnabled(false);
      setMessage("이 기기의 Yuno920 알림을 껐어요.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "알림을 해제하지 못했습니다");
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await postWithAuth<SendResponse>("/api/notifications/push/test", {});
      setMessage(result.sent > 0 ? "테스트 알림을 보냈어요. 잠시 후 기기를 확인해주세요." : "알림을 보낼 기기가 없습니다.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "테스트 알림을 보내지 못했습니다");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.card}>
      <div className={styles.icon} aria-hidden="true">✦</div>
      <div className={styles.content}>
        <div className={styles.headingRow}>
          <div>
            <h2 className={styles.title}>기기 알림</h2>
            <p className={styles.description}>승인 완료나 중요한 소식을 놓치지 않도록 알려드려요.</p>
          </div>
          {enabled && <span className={styles.status}>사용 중</span>}
        </div>
        {supported === false ? (
          <p className={styles.note}>현재 브라우저에서는 웹 알림을 지원하지 않아요. Chrome, Edge 또는 Safari를 이용해주세요.</p>
        ) : !publicKey ? (
          <p className={styles.note}>웹 알림 서버 설정을 완료하면 이 기능을 사용할 수 있어요.</p>
        ) : (
          <div className={styles.actions}>
            <Button size="small" onClick={() => void (enabled ? disable() : enable())} loading={busy}>
              {enabled ? "알림 끄기" : "알림 켜기"}
            </Button>
            {enabled && <Button size="small" variant="secondary" onClick={() => void sendTest()} disabled={busy}>테스트 알림</Button>}
          </div>
        )}
        {message && <p className={styles.message} role="status">{message}</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
    </section>
  );
}
