import React from "react";
import { cn } from "../lib/cn";

export interface BadgeProps {
  variant?: "safe" | "caution" | "danger" | "info" | "neutral" | "primary";
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  children,
  icon,
  className,
}) => {
  const variantStyles = {
    safe: "bg-safe/15 text-safe border-safe/30",
    caution: "bg-caution/15 text-caution border-caution/30",
    danger: "bg-danger/15 text-danger border-danger/30",
    info: "bg-info/15 text-info border-info/30",
    primary: "bg-primary/15 text-primary border-primary/30",
    neutral: "bg-white/10 text-text-2 border-white/10",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none",
        variantStyles[variant],
        className
      )}
    >
      {icon && <span className="w-3 h-3 flex items-center justify-center">{icon}</span>}
      {children}
    </span>
  );
};
