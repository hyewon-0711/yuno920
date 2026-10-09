export type PushSubscriptionPayload = {
  endpoint: string;
  expiration_time: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export async function getPushSubscription() {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration("/");
  return registration?.pushManager.getSubscription() ?? null;
}

function decodeVapidKey(key: string) {
  const padding = "=".repeat((4 - (key.length % 4)) % 4);
  const base64 = (key + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export async function subscribeToPush(publicKey: string): Promise<PushSubscriptionPayload> {
  if (!isPushSupported()) throw new Error("이 브라우저에서는 웹 알림을 사용할 수 없습니다");
  if (!publicKey) throw new Error("웹 알림 서버 설정이 아직 완료되지 않았습니다");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("알림 권한이 허용되지 않았습니다. 브라우저 사이트 설정에서 알림을 허용해주세요");
  }

  const registration = await navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeVapidKey(publicKey) as BufferSource,
    });
  }

  const json = subscription.toJSON();
  const keys = json.keys;
  if (!json.endpoint || !keys?.p256dh || !keys.auth) {
    throw new Error("브라우저 알림 구독 정보를 읽지 못했습니다");
  }

  return {
    endpoint: json.endpoint,
    expiration_time: json.expirationTime ?? null,
    keys: {
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  };
}
