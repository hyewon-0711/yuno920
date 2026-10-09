"use client";

import Link from "next/link";
import { Check, Clock3, Sparkles } from "lucide-react";
import { useDailyMissions, type DailyMission, type MissionArea } from "@/hooks/useDailyMissions";
import styles from "./MissionBoard.module.css";

const areaLabels: Record<MissionArea, string> = {
  physical: "몸놀이",
  learning: "배움",
  social: "마음 나눔",
  creative: "창의",
  habit: "생활 습관",
};

interface Props {
  childId: string;
  compact?: boolean;
}

function MissionItem({ mission, onToggle }: { mission: DailyMission; onToggle: (mission: DailyMission) => Promise<void> }) {
  const completed = mission.status === "completed";
  return (
    <article className={`${styles.mission} ${completed ? styles.completed : ""}`}>
      <div className={styles.missionIcon} aria-hidden="true">
        {completed ? <Check size={18} strokeWidth={3} /> : <Sparkles size={18} />}
      </div>
      <div className={styles.missionBody}>
        <div className={styles.meta}>
          <span>{areaLabels[mission.area]}</span>
          <span className={styles.dot}>·</span>
          <span><Clock3 size={12} /> {mission.estimated_minutes}분</span>
          {mission.is_bonus && <span className={styles.bonus}>BONUS</span>}
        </div>
        <h3>{mission.title_snapshot}</h3>
        <p>{mission.description_snapshot}</p>
      </div>
      <button
        type="button"
        className={`${styles.completeButton} ${completed ? styles.completeButtonDone : ""}`}
        onClick={() => void onToggle(mission)}
        aria-pressed={completed}
      >
        {completed ? "완료됨" : "완료"}
      </button>
    </article>
  );
}

export default function MissionBoard({ childId, compact = false }: Props) {
  const { missions, loading, error, toggleComplete } = useDailyMissions(childId);
  const coreMissions = missions.filter((mission) => !mission.is_bonus);
  const completedCount = coreMissions.filter((mission) => mission.status === "completed").length;
  const visibleMissions = compact ? coreMissions : missions;

  if (loading) {
    return <section className={styles.card}><p className={styles.loading}>오늘의 미션을 준비하고 있어요...</p></section>;
  }

  if (error) {
    return <section className={styles.card}><p className={styles.error} role="alert">{error}</p></section>;
  }

  return (
    <section className={`${styles.card} ${compact ? styles.compact : ""}`}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>TODAY&apos;S LITTLE WINS</p>
          <h2>오늘의 미션</h2>
          <p className={styles.subtitle}>작은 실천 세 가지가 오늘을 더 특별하게 만들어요.</p>
        </div>
        <div className={styles.progress} aria-label={`핵심 미션 ${completedCount}개 완료, 총 ${coreMissions.length}개`}>
          <strong>{completedCount}<small>/{coreMissions.length}</small></strong>
          <span>완료</span>
        </div>
      </div>
      <div className={styles.progressTrack} aria-hidden="true"><span style={{ width: `${coreMissions.length ? (completedCount / coreMissions.length) * 100 : 0}%` }} /></div>
      <div className={styles.list}>
        {visibleMissions.map((mission) => <MissionItem key={mission.id} mission={mission} onToggle={toggleComplete} />)}
      </div>
      {compact && <Link href="/play/missions" className={styles.moreLink}>선택 미션까지 모두 보기 <span aria-hidden="true">→</span></Link>}
    </section>
  );
}
