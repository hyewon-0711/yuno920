import styles from "./PageIntro.module.css";

export default function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <section className={styles.intro}>
    <span className={styles.eyebrow}>{eyebrow}</span>
    <h2>{title}</h2>
    <p>{description}</p>
    <span className={styles.decoration} aria-hidden="true">✳</span>
  </section>;
}
