interface TagProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

const colorMap: Record<string, string> = {
  orange: "bg-orange-100 text-orange-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  purple: "bg-purple-100 text-purple-700",
  red: "bg-red-100 text-red-700",
  yellow: "bg-yellow-100 text-yellow-700",
  gray: "bg-gray-100 text-gray-600",
};

export default function Tag({ children, color = "gray", className = "" }: TagProps) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-medium ${colorMap[color] || colorMap.gray} ${className}`}
    >
      {children}
    </span>
  );
}
