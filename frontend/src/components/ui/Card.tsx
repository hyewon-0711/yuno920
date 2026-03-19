import styles from "./Card.module.css";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export default function Card({
  children,
  className = "",
  onClick,
  selected = false,
}: CardProps) {
  return (
    <div
      className={[
        styles.card,
        onClick ? styles.clickable : "",
        selected ? styles.selected : "",
        className,
      ].join(" ")}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
