"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChild } from "@/hooks/useChild";
import { postWithAuth } from "@/lib/api";
import AppHeader from "@/components/layout/AppHeader";
import styles from "./page.module.css";

type Message = { role: "user" | "assistant"; content: string };

function formatChatApiError(raw: string): string {
  if (raw.includes("SUPABASE_JWT_SECRET") || /\(POST[^)]*503\)/.test(raw) || raw.includes("503")) {
    return "서버에 인증 키가 설정되지 않았어요.\nRender(또는 API 호스트)에 환경변수 SUPABASE_JWT_SECRET\n(Supabase → Project Settings → API → JWT Secret)을 등록한 뒤 다시 시도해 주세요.";
  }
  if (raw.includes("Failed to fetch") || raw.includes("NetworkError") || raw.includes("Load failed")) {
    return "서버에 연결하지 못했어요. 인터넷·배포 환경변수 NEXT_PUBLIC_API_URL(백엔드 URL)이 맞는지 확인해 주세요.";
  }
  if (raw.includes("403") || raw.includes("권한")) {
    return "이 아이 데이터에 대한 권한이 없어요. 같은 계정으로 가입·연결됐는지 확인해 주세요.";
  }
  if (raw.includes("로그인 세션") || raw.includes("401")) {
    return "로그인이 만료됐을 수 있어요. 한 번 로그아웃 후 다시 로그인해 보세요.\n\n" + raw;
  }
  const short = raw.length > 380 ? raw.slice(0, 380) + "…" : raw;
  return "응답을 가져오지 못했어요. 아래 메시지를 참고하세요.\n\n" + short;
}

export default function ChatPage() {
  const router = useRouter();
  const redirectingRef = useRef(false);
  const { user, loading: authLoading } = useAuth();
  const { child, loading: childLoading } = useChild();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      if (!redirectingRef.current) {
        redirectingRef.current = true;
        router.replace("/auth/login");
      }
      return;
    }
    if (childLoading) return;
    if (!child) {
      if (!redirectingRef.current) {
        redirectingRef.current = true;
        router.replace("/onboarding");
      }
    }
  }, [authLoading, user, childLoading, child, router]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, sending]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !child || sending) return;

    setInput("");
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await postWithAuth<{ reply: string }>("/api/ai/chat-assistant", {
        child_id: child.id,
        message: text,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "알 수 없는 오류";
      const friendly = formatChatApiError(raw);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: friendly },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading || childLoading) {
    return (
      <>
        <AppHeader title="도우미" />
        <div className={styles.page}>
          <p style={{ textAlign: "center", color: "var(--text-tertiary)" }}>불러오는 중...</p>
        </div>
      </>
    );
  }

  if (!child) return null;

  const isEmpty = messages.length === 0;

  return (
    <>
      <AppHeader title="도우미" />
      <div className={styles.page}>
        <div className={styles.list} ref={listRef}>
          {isEmpty ? (
            <div className={styles.welcome}>
              <p className={styles.welcomeText}>
                안녕하세요, {child.name}의 일상을 도와주는 AI 도우미예요.
              </p>
              <p className={styles.welcomeHint}>
                예: &quot;오늘 {child.name} 일정 브리핑해줘&quot;, &quot;오늘 기록 요약해줘&quot;
              </p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? styles.bubbleUser : styles.bubbleAssistant}>
                {m.content}
              </div>
            ))
          )}
          {sending && (
            <div
              className={styles.bubbleAssistant}
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <div className={styles.typingBlock}>
                <div className={styles.progressTrack} aria-hidden>
                  <div className={styles.progressShimmer} />
                </div>
                <div className={styles.typingRow}>
                  <span className={styles.typingText}>응답을 준비하고 있어요</span>
                  <span className={styles.dotWrap} aria-hidden>
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <input
            type="text"
            className={styles.input}
            placeholder="질문을 입력하세요"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
          <button
            type="button"
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={sending || !input.trim()}
            aria-label="보내기"
          >
            전송
          </button>
        </div>
      </div>
    </>
  );
}
