import { supabase } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const url = `${API_URL}${endpoint}`;
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const d = err.detail;
    const msg =
      typeof d === "string"
        ? d
        : Array.isArray(d)
          ? d.map((x: { msg?: string }) => x?.msg || "").filter(Boolean).join(", ")
          : `API Error: ${res.status}`;
    const base = msg || `API Error: ${res.status}`;
    throw new Error(`${base} (${method} ${url})`);
  }

  return res.json();
}

async function getAccessToken(): Promise<string | undefined> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

/** Supabase access_token으로 보호된 FastAPI 엔드포인트용 */
export async function postWithAuth<T>(endpoint: string, body: unknown): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new Error("로그인이 필요합니다.");
  return request<T>(endpoint, { method: "POST", body, token });
}

export async function getWithAuth<T>(endpoint: string): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new Error("로그인이 필요합니다.");
  return request<T>(endpoint, { token });
}

export const api = {
  get: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, { token }),

  post: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: "POST", body, token }),

  put: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: "PUT", body, token }),

  patch: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: "PATCH", body, token }),

  delete: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, { method: "DELETE", token }),
};
