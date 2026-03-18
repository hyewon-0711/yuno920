interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div
      className={`rounded-2xl bg-white p-4 shadow-sm ${onClick ? "cursor-pointer active:scale-[0.99] transition-transform" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
