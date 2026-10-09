import Link from "next/link";
import { ArrowUpRight, BookOpen, Heart, Sprout, Sun } from "lucide-react";
import type { ReactNode } from "react";
import styles from "@/app/auth/login/page.module.css";

export default function AuthFrame({ children }: { children: ReactNode }) {
  return <main className={styles.page}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="Yuno920 홈"><span className={styles.brandIcon}><Sprout size={22} /></span>yuno<span className={styles.brandNumber}>920</span></Link>
      <span className={styles.headerNote}>함께 기록하고, 함께 자라요</span>
    </header>
    <div className={styles.layout}>
      <section className={styles.story} aria-label="Yuno920 소개">
        <p className={styles.eyebrow}><span /> LITTLE MOMENTS, BIG GROWTH</p>
        <h1 className={styles.headline}>작은 오늘이 모여,<br />아이의 <span>내일이 돼요.</span></h1>
        <p className={styles.description}>처음 해낸 일도, 함께 웃었던 순간도.<br />아이의 속도에 맞춰 소중한 성장을 기록해요.</p>
        <div className={styles.illustration} aria-hidden="true">
          <div className={styles.orbit} /><Sun className={styles.sun} size={54} strokeWidth={1.3} />
          <div className={styles.memoryCard}>
            <span className={styles.cardKicker}>우리 아이의 성장 한 페이지</span>
            <div className={styles.plant}><span className={styles.leafLeft} /><span className={styles.stem} /><span className={styles.leafRight} /><span className={styles.pot} /></div>
            <strong>어제보다 한 뼘 더</strong><span className={styles.cardCaption}>매일 조금씩, 나만의 속도로</span>
            <div className={styles.cardDots}><i /><i /><i /><i /><i /></div>
          </div>
          <div className={styles.memoryBadge}><span><BookOpen size={20} /></span><div><strong>함께 읽은 이야기</strong><small>마음도 한 뼘 자랐어요</small></div></div>
          <div className={styles.heartBadge}><Heart size={22} fill="currentColor" /><span>오늘도 잘 자라고 있어요</span></div>
          <span className={styles.sparkle}>✳</span>
        </div>
        <p className={styles.storyFooter}>기록에서 발견하는 우리 아이만의 가능성 <ArrowUpRight size={16} /></p>
      </section>
      <section className={styles.panel}>{children}</section>
    </div>
    <footer className={styles.pageFooter}>아이의 모든 처음을, 함께. <span>© Yuno920</span></footer>
  </main>;
}
