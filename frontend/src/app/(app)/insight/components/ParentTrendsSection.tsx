"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { normalizeInterestIds, type ParentInterestId } from "@/lib/parentInterests";
import styles from "./ParentTrendsSection.module.css";

type TrendItem = { title: string; link: string; pubDate?: string };

type Group = {
  id: ParentInterestId;
  label: string;
  hashtag: string;
  items: TrendItem[];
};

type ApiBody = { fetchedAt: string; groups: Group[] };

export default function ParentTrendsSection() {
  const [tags, setTags] = useState<ParentInterestId[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [data, setData] = useState<ApiBody | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancel) setLoading(false);
        return;
      }
      const { data: row, error: qErr } = await supabase
        .from("users")
        .select("parent_interest_tags")
        .eq("id", user.id)
        .maybeSingle();
      if (cancel) return;
      if (qErr) {
        console.error("parent_interest_tags:", qErr);
        setTags([]);
      } else {
        const raw = (row?.parent_interest_tags as string[] | null) ?? [];
        setTags(normalizeInterestIds(raw));
      }
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (tags.length === 0) {
      setData(null);
      return;
    }
    let cancel = false;
    (async () => {
      setTrendsLoading(true);
      setError(null);
      try {
        const q = new URLSearchParams({ tags: tags.join(",") });
        const res = await fetch(`/api/insight/trends?${q.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ApiBody;
        if (!cancel) setData(json);
      } catch (e) {
        if (!cancel) setError(e instanceof Error ? e.message : "불러오기 실패");
      } finally {
        if (!cancel) setTrendsLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [tags, loading]);

  if (loading) {
    return <p className={styles.muted}>관심사 확인 중...</p>;
  }

  if (tags.length === 0) {
    return (
      <div className={styles.empty}>
        <p>선택한 부모 관심사가 없어요. 온보딩이나 설정에서 태그를 고르면 오늘의 뉴스 흐름을 모아 보여드려요.</p>
        <Link href="/settings" className={styles.link}>
          설정에서 관심사 선택하기
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <p className={styles.error} role="alert">
        트렌드를 불러오지 못했습니다: {error}
      </p>
    );
  }

  if (trendsLoading || !data) {
    return <p className={styles.muted}>맞춤 뉴스를 불러오는 중...</p>;
  }

  return (
    <div className={styles.root}>
      <p className={styles.meta}>
        선택한 관심사 기준 · Google 뉴스(RSS) · {new Date(data.fetchedAt).toLocaleString("ko-KR")}
      </p>
      {data.groups.map((g) => (
        <section key={g.id} className={styles.group} aria-labelledby={`trend-${g.id}`}>
          <h4 id={`trend-${g.id}`} className={styles.groupTitle}>
            <span className={styles.tagBadge}>{g.hashtag}</span> {g.label}
          </h4>
          {g.items.length === 0 ? (
            <p className={styles.muted}>이번에는 기사를 가져오지 못했어요. 잠시 후 다시 시도해보세요.</p>
          ) : (
            <ul className={styles.list}>
              {g.items.map((item) => (
                <li key={item.link} className={styles.item}>
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className={styles.itemLink}>
                    {item.title}
                  </a>
                  {item.pubDate && <span className={styles.date}>{item.pubDate}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
