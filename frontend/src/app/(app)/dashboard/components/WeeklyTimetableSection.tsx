"use client";

import { useMemo, useState } from "react";
import { Button, Input } from "@/components/ui";
import Modal from "@/components/ui/Modal";
import { useWeeklyTimetable, WEEKDAY_LABELS, type WeeklyTimetableEntry } from "@/hooks/useWeeklyTimetable";
import styles from "./WeeklyTimetableSection.module.css";

interface Props {
  childId: string;
}

export default function WeeklyTimetableSection({ childId }: Props) {
  const { entries, loading, loadError, addEntry, updateEntry, deleteEntry, toHhMm } = useWeeklyTimetable(childId);

  const byDay = useMemo(() => {
    const m: WeeklyTimetableEntry[][] = Array.from({ length: 7 }, () => []);
    for (const e of entries) {
      if (e.day_of_week >= 0 && e.day_of_week <= 6) {
        m[e.day_of_week].push(e);
      }
    }
    m.forEach((list) => list.sort((a, b) => a.start_time.localeCompare(b.start_time)));
    return m;
  }, [entries]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [day, setDay] = useState(0);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const openNew = () => {
    setEditingId(null);
    setDay(0);
    setStartTime("09:00");
    setEndTime("10:00");
    setTitle("");
    setNotes("");
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (e: WeeklyTimetableEntry) => {
    setEditingId(e.id);
    setDay(e.day_of_week);
    setStartTime(toHhMm(e.start_time));
    setEndTime(toHhMm(e.end_time));
    setTitle(e.title);
    setNotes(e.notes || "");
    setFormError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setFormError("제목을 입력해주세요");
      return;
    }
    if (startTime >= endTime) {
      setFormError("종료 시각이 시작보다 늦어야 합니다");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editingId) {
        await updateEntry(editingId, {
          day_of_week: day,
          start_time: startTime,
          end_time: endTime,
          title: title.trim(),
          notes: notes.trim() || null,
        });
      } else {
        await addEntry({
          day_of_week: day,
          start_time: startTime,
          end_time: endTime,
          title: title.trim(),
          notes: notes.trim() || null,
        });
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId || !confirm("이 시간표를 삭제할까요?")) return;
    setSaving(true);
    setFormError("");
    try {
      await deleteEntry(editingId);
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "삭제에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.card} aria-label="주간 시간표">
      <div className={styles.header}>
        <h3 className={styles.title}>📆 주간 시간표</h3>
        <button type="button" className={styles.addBtn} onClick={openNew}>
          + 추가
        </button>
      </div>

      {loadError && (
        <p className={styles.error} role="alert">
          주간 시간표를 불러올 수 없습니다: {loadError}
          <br />
          <span style={{ fontSize: 12 }}>
            <strong>운영 Supabase</strong>에서 <code style={{ fontSize: 11 }}>003_weekly_timetable.sql</code> ·{" "}
            <code style={{ fontSize: 11 }}>004_rls_child_owner_fallback.sql</code> 적용 여부를 확인하세요. 테이블이 없으면
            이 영역이 비어 있습니다.
          </span>
        </p>
      )}

      {loading ? (
        <p className={styles.muted}>불러오는 중...</p>
      ) : (
        <>
          {!loadError && entries.length === 0 && (
            <p className={styles.emptyBanner}>
              등록된 주간 일정이 아직 없어요. <strong>+ 추가</strong>로 입력하거나,{" "}
              <code style={{ fontSize: 11 }}>seed_weekly_timetable_from_sheet.sql</code>로 일괄 입력할 수 있어요. (child_id
              교체 필요)
            </p>
          )}
          {!loadError && entries.length > 0 && (
            <span className={styles.gridScrollHint}>좁은 화면에서는 요일이 세로로 쌓입니다. 넓은 화면에서는 7열로 표시됩니다.</span>
          )}
          <div className={styles.grid}>
          {WEEKDAY_LABELS.map((label, d) => (
            <div key={d} className={styles.dayCol}>
              <div className={styles.dayLabel}>{label}</div>
              <div className={styles.dayBody}>
                {byDay[d].length === 0 ? (
                  <p className={styles.emptyDay}>-</p>
                ) : (
                  byDay[d].map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      className={`${styles.slot} ${e.color ? "" : styles.slotMuted}`}
                      style={e.color ? { borderLeftColor: e.color } : undefined}
                      onClick={() => openEdit(e)}
                    >
                      <div className={styles.slotTime}>
                        {toHhMm(e.start_time)}–{toHhMm(e.end_time)}
                      </div>
                      <div className={styles.slotTitle}>{e.title}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {showModal && (
        <Modal
          title={editingId ? "시간표 수정" : "시간표 추가"}
          onClose={() => {
            setShowModal(false);
            setFormError("");
          }}
        >
          <div className={styles.form}>
            <div>
              <p className="text-body-sm" style={{ margin: "0 0 var(--space-2)", color: "var(--text-tertiary)" }}>
                요일
              </p>
              <div className={styles.dayPick}>
                {WEEKDAY_LABELS.map((label, d) => (
                  <button
                    key={d}
                    type="button"
                    className={`${styles.dayPickBtn} ${day === d ? styles.dayPickBtnActive : ""}`}
                    onClick={() => setDay(d)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.row2}>
              <Input label="시작" type="time" value={startTime} onChange={(ev) => setStartTime(ev.target.value)} />
              <Input label="종료" type="time" value={endTime} onChange={(ev) => setEndTime(ev.target.value)} />
            </div>
            <Input label="제목" value={title} onChange={(ev) => setTitle(ev.target.value)} placeholder="예: 피아노" />
            <Input label="메모 (선택)" value={notes} onChange={(ev) => setNotes(ev.target.value)} />
            {formError && <p className={styles.formError}>{formError}</p>}
            <div className={styles.actions}>
              {editingId && (
                <Button type="button" variant="destructive" size="small" onClick={() => void handleDelete()} disabled={saving}>
                  삭제
                </Button>
              )}
              <Button type="button" variant="secondary" size="small" onClick={() => setShowModal(false)}>
                취소
              </Button>
              <Button type="button" size="small" onClick={() => void handleSave()} loading={saving}>
                저장
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
