"use client";

import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-[var(--hmc-blue)] text-white shadow-sm hover:bg-[var(--hmc-blue-dark)] hover:shadow-md",
    secondary: "bg-[var(--hmc-blue-muted)] text-[var(--hmc-blue)] hover:bg-[var(--hmc-blue-border)]",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-[var(--hmc-blue)] hover:bg-[var(--hmc-blue-muted)]",
    outline: "border border-[var(--hmc-blue-border)] bg-white text-[var(--hmc-blue)] hover:bg-[var(--hmc-blue-muted)]",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
