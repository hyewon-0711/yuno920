import styles from "./Tag.module.css";

type TagColor =
  | "health" | "meal" | "learning" | "play"
  | "emotion" | "reading" | "milestone" | "default";

interface TagProps {
  children: React.ReactNode;
  color?: TagColor;
}

export default function Tag({ children, color = "default" }: TagProps) {
  return (
    <span className={[styles.tag, styles[color]].join(" ")}>
      {children}
    </span>
  );
}
