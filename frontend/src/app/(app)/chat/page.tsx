"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChild } from "@/hooks/useChild";
import { api } from "@/lib/api";
import AppHeader from "@/components/layout/AppHeader";
import styles from "./page.module.css";

type Message = { role: "user" | "assistant"; content: string };

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
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !child || sending) return;

    setInput("");
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await api.post<{ reply: string }>("/api/ai/chat-assistant", {
        child_id: child.id,
        message: text,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "응답을 불러오는 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요." },
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
            <div className={styles.bubbleAssistant}>
              <span className={styles.typing}>...</span>
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
