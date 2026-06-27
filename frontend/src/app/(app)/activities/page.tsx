"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, BarChart3, Brain, Plus, RefreshCw, Trash2 } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { postWithAuth } from "@/lib/api";
import { useChild } from "@/hooks/useChild";
import {
  ACTIVITY_AREAS,
  ACTIVITY_FREQUENCIES,
  type ActivityArea,
  type ActivityInput,
  type ChildActivity,
  getActivityAreaLabel,
  getActivityFrequencyLabel,
  useActivities,
} from "@/hooks/useActivities";
import styles from "./page.module.css";

type AssessmentResponse = {
  id: string;
  summary: string;
  score: number;
  result: {
    overall_score?: number;
    summary?: string;
    load_level?: string;
    balance?: Record<string, number>;
    keep?: Array<{ activity?: string; reason?: string }>;
    adjust?: Array<{ activity?: string; reason?: string }>;
    add?: Array<{ area?: string; suggestion?: string }>;
    parent_actions?: string[];
    disclaimer?: string;
  };
};

const balanceLabels: Record<string, string> = {
  learning: "학습",
  physical: "신체",
  creative: "창의",
  social: "사회",
  emotion: "정서",
  habit: "습관",
};

const areaClass: Record<string, string> = {
  learning: styles.areaLearning,
  physical: styles.areaPhysical,
  creative: styles.areaCreative,
  social: styles.areaSocial,
  emotion: styles.areaEmotion,
  reading: styles.areaReading,
  habit: styles.areaHabit,
  other: styles.areaOther,
};

function emptyInput(): ActivityInput {
  return { title: "", area: "learning", frequency: "weekly_1" };
}

export default function ActivitiesPage() {
  const router = useRouter();
  const redirectingRef = useRef(false);
  const { user, loading: authLoading } = useAuth();
  const { child, loading: childLoading } = useChild();
  const {
    activities,
    latestAssessment,
    isAssessmentStale,
    loading,
    loadError,
    addActivity,
    updateActivity,
    deleteActivity,
    refetch,
  } = useActivities(child?.id);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ChildActivity | null>(null);
  const [form, setForm] = useState<ActivityInput>(emptyInput);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    if (!child && !redirectingRef.current) {
      redirectingRef.current = true;
      router.replace("/onboarding");
    }
  }, [authLoading, user, childLoading, child, router]);

  const assessment = latestAssessment?.result_json;
  const score = latestAssessment?.score || assessment?.overall_score || 0;
  const summary = latestAssessment?.summary || assessment?.summary || "";
  const loadLevel = assessment?.load_level || "분석 전";

  const areaCounts = useMemo(() => {
    const counts = new Map<ActivityArea, number>();
    activities.forEach((item) => counts.set(item.area, (counts.get(item.area) || 0) + 1));
    return counts;
  }, [activities]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyInput());
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (activity: ChildActivity) => {
    setEditing(activity);
    setForm({
      title: activity.title,
      area: activity.area,
      frequency: activity.frequency,
    });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = (force = false) => {
    if (saving && !force) return;
    setShowForm(false);
    setEditing(null);
    setForm(emptyInput());
    setFormError("");
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setFormError("활동명을 입력해주세요.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const payload = { ...form, title: form.title.trim() };
      if (editing) await updateActivity(editing.id, payload);
      else await addActivity(payload);
      closeForm(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "활동 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    setSaving(true);
    setFormError("");
    try {
      await deleteActivity(editing.id);
      setShowDeleteConfirm(false);
      closeForm(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "활동 삭제에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    if (!child || activities.length === 0 || analyzing) return;
    setAnalyzing(true);
    setAnalysisError("");

    try {
      await postWithAuth<AssessmentResponse>("/api/ai/activity-assessment", { child_id: child.id });
      await refetch();
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "AI 분석에 실패했습니다.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (authLoading || childLoading || !child) {
    return (
      <>
        <AppHeader title="활동" />
        <div className={styles.page}>
          <p className={styles.muted}>불러오는 중...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader
        title="활동"
        rightAction={
          <button type="button" className={styles.headerBtn} onClick={openCreate} aria-label="활동 추가">
            <Plus size={20} />
          </button>
        }
      />
      <div className={styles.page}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>AI 활동 적절성</p>
            <h2>{summary || "활동을 추가하고 균형을 확인해보세요"}</h2>
            <div className={styles.heroChips}>
              <span>{activities.length}개 활동</span>
              <span>부담도 {loadLevel}</span>
              <span>{latestAssessment ? (isAssessmentStale ? "재분석 필요" : `${score}점`) : "분석 전"}</span>
            </div>
          </div>
          <div className={styles.scoreRing} style={{ "--score": `${Math.max(0, Math.min(100, score))}%` } as React.CSSProperties}>
            <strong>{score || "-"}</strong>
          </div>
        </section>

        {loadError && <p className={styles.errorBox}>{loadError}</p>}
        {analysisError && <p className={styles.errorBox}>{analysisError}</p>}

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3>진행 중인 활동</h3>
            <button type="button" className={styles.textBtn} onClick={openCreate}>
              활동 추가
            </button>
          </div>

          {loading ? (
            <p className={styles.muted}>활동을 불러오는 중...</p>
          ) : activities.length === 0 ? (
            <div className={styles.empty}>
              <Activity size={28} />
              <h3>윤호가 하고 있는 활동을 추가해보세요</h3>
              <p>활동명, 영역, 빈도만 입력하면 AI가 전체 균형을 분석할 수 있습니다.</p>
              <Button type="button" onClick={openCreate}>활동 추가</Button>
            </div>
          ) : (
            <div className={styles.activityList}>
              {activities.map((activity) => (
                <button key={activity.id} type="button" className={styles.activityCard} onClick={() => openEdit(activity)}>
                  <div>
                    <div className={styles.activityTitle}>{activity.title}</div>
                    <div className={styles.activityMeta}>
                      {getActivityAreaLabel(activity.area)} · {getActivityFrequencyLabel(activity.frequency)}
                    </div>
                  </div>
                  <span className={`${styles.areaBadge} ${areaClass[activity.area] || styles.areaOther}`}>
                    {getActivityAreaLabel(activity.area)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={styles.analysisPanel}>
          <div className={styles.analysisHeader}>
            <div>
              <p className={styles.eyebrow}>AI 분석</p>
              <h3>{latestAssessment ? "최근 분석 결과" : "활동 균형 분석"}</h3>
            </div>
            <Brain size={24} />
          </div>

          {latestAssessment ? (
            <div className={styles.analysisBody}>
              {isAssessmentStale && (
                <p className={styles.errorBox}>활동이 변경되어 아래 결과는 이전 구성 기준입니다. 다시 분석해주세요.</p>
              )}
              <p>{summary}</p>
              {assessment?.balance && (
                <div className={styles.balanceGrid}>
                  {Object.entries(assessment.balance).map(([key, value]) => (
                    <div key={key} className={styles.balanceRow}>
                      <span>{balanceLabels[key] || key}</span>
                      <div className={styles.balanceTrack}>
                        <div className={styles.balanceFill} style={{ width: `${Math.max(0, Math.min(100, Number(value) || 0))}%` }} />
                      </div>
                      <strong>{Number(value) || 0}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.recommendGrid}>
                <RecommendationBlock title="유지 추천" items={assessment?.keep?.map((item) => `${item.activity || "활동"}: ${item.reason || ""}`)} />
                <RecommendationBlock title="조정 추천" items={assessment?.adjust?.map((item) => `${item.activity || "활동"}: ${item.reason || ""}`)} />
                <RecommendationBlock title="추가 추천" items={assessment?.add?.map((item) => `${item.area || "영역"}: ${item.suggestion || ""}`)} />
              </div>

              {assessment?.parent_actions && assessment.parent_actions.length > 0 && (
                <div className={styles.actionsBox}>
                  <h4>이번 주 부모 액션</h4>
                  <ul>
                    {assessment.parent_actions.map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className={styles.analysisEmpty}>
              활동을 추가한 뒤 AI 분석으로 학습, 신체, 정서, 창의, 사회성 균형을 확인할 수 있습니다.
            </p>
          )}

          <Button
            type="button"
            fullWidth
            onClick={() => void handleAnalyze()}
            disabled={activities.length === 0 || analyzing}
            loading={analyzing}
          >
            <RefreshCw size={16} />
            AI 분석하기
          </Button>
          <p className={styles.disclaimer}>이 분석은 기록된 활동을 바탕으로 한 참고용 AI 코칭입니다.</p>
        </section>

        {activities.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h3>영역 구성</h3>
              <BarChart3 size={20} />
            </div>
            <div className={styles.areaSummary}>
              {ACTIVITY_AREAS.map((area) => (
                <div key={area.value} className={styles.areaSummaryItem}>
                  <span>{area.label}</span>
                  <strong>{areaCounts.get(area.value) || 0}</strong>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {showForm && (
        <Modal title={editing ? "활동 수정" : "활동 추가"} onClose={() => closeForm()}>
          <div className={styles.form}>
            <Input
              label="활동명"
              placeholder="예: 태권도"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            />

            <div>
              <p className={styles.fieldLabel}>영역</p>
              <div className={styles.optionGrid}>
                {ACTIVITY_AREAS.map((area) => (
                  <button
                    key={area.value}
                    type="button"
                    className={`${styles.optionBtn} ${form.area === area.value ? styles.optionBtnActive : ""}`}
                    onClick={() => setForm((prev) => ({ ...prev, area: area.value }))}
                  >
                    {area.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className={styles.fieldLabel}>빈도</p>
              <div className={styles.optionGrid}>
                {ACTIVITY_FREQUENCIES.map((frequency) => (
                  <button
                    key={frequency.value}
                    type="button"
                    className={`${styles.optionBtn} ${form.frequency === frequency.value ? styles.optionBtnActive : ""}`}
                    onClick={() => setForm((prev) => ({ ...prev, frequency: frequency.value }))}
                  >
                    {frequency.label}
                  </button>
                ))}
              </div>
            </div>

            {formError && <p className={styles.formError}>{formError}</p>}

            <div className={styles.formActions}>
              {editing && (
                <Button type="button" variant="destructive" size="small" onClick={() => setShowDeleteConfirm(true)} disabled={saving}>
                  <Trash2 size={15} />
                  삭제
                </Button>
              )}
              <Button type="button" variant="secondary" size="small" onClick={() => closeForm()} disabled={saving}>
                취소
              </Button>
              <Button type="button" size="small" onClick={() => void handleSave()} loading={saving}>
                저장
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteConfirm && editing && (
        <Modal title="활동 삭제" onClose={() => !saving && setShowDeleteConfirm(false)}>
          <div className={styles.form}>
            <p>&lsquo;{editing.title}&rsquo; 활동을 삭제할까요? 삭제한 활동은 복구할 수 없습니다.</p>
            {formError && <p className={styles.formError}>{formError}</p>}
            <div className={styles.formActions}>
              <Button type="button" variant="secondary" size="small" onClick={() => setShowDeleteConfirm(false)} disabled={saving}>
                취소
              </Button>
              <Button type="button" variant="destructive" size="small" onClick={() => void handleDelete()} loading={saving}>
                삭제
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function RecommendationBlock({ title, items }: { title: string; items: string[] | undefined }) {
  return (
    <div className={styles.recommendBlock}>
      <h4>{title}</h4>
      {items && items.length > 0 ? (
        <ul>
          {items.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      ) : (
        <p>아직 제안이 없습니다.</p>
      )}
    </div>
  );
}
