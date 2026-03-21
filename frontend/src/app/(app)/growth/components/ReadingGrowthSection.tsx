"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import EmptyState from "@/components/ui/EmptyState";
import type { MonthlyReading } from "@/hooks/useReadingGrowth";
import styles from "./ReadingGrowthSection.module.css";

interface Props {
  data: MonthlyReading[];
  loading: boolean;
}

export default function ReadingGrowthSection({ data, loading }: Props) {
  const chartData = data.map((d) => ({
    month: d.month.slice(5) + "월",
    분: d.totalMinutes,
    권: d.bookCount,
  }));

  return (
    <section className={styles.section}>
      <h3 className={styles.title}>📚 독서 성장</h3>

      {loading ? (
        <p className={styles.loading}>불러오는 중...</p>
      ) : chartData.length === 0 ? (
        <EmptyState
          icon="📚"
          title="독서 기록을 추가해보세요"
          description="Record 탭에서 독서 기록을 남기면 월별 추이를 볼 수 있어요"
        />
      ) : (
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--text-tertiary)" />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="var(--text-tertiary)" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="var(--text-tertiary)" />
              <Tooltip
                contentStyle={{ background: "var(--bg-card)", borderRadius: "var(--radius-md)" }}
              />
              <Bar yAxisId="left" dataKey="분" name="읽은 시간(분)" fill="var(--tab-growth)" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="권" name="책 권수" fill="var(--tab-record)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
