import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "default" | "small";
  fullWidth?: boolean;
}

const variantStyles = {
  primary: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] active:scale-[0.98]",
  secondary: "border border-[var(--color-primary)] text-[var(--color-primary)] bg-white hover:bg-[var(--color-primary-light)] active:scale-[0.98]",
  ghost: "text-gray-700 bg-transparent hover:bg-gray-100 active:scale-[0.98]",
};

const sizeStyles = {
  default: "h-12 px-6 text-base rounded-xl",
  small: "h-9 px-4 text-sm rounded-lg",
};

export default function Button({
  variant = "primary",
  size = "default",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-semibold transition-all duration-200
        disabled:opacity-50 disabled:pointer-events-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
