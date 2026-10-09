import React, { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "../lib/cn";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "ghost" | "icon" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

    const sizeStyles = {
      sm: "h-8 px-3 text-xs rounded-input gap-1.5",
      md: "h-10 px-4 text-sm rounded-input gap-2",
      lg: "h-12 px-6 text-base rounded-input gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-primary text-bg-0 font-semibold shadow-md hover:brightness-110 active:brightness-95 shadow-primary/20",
      secondary:
        "bg-bg-2/80 text-text-1 border border-glass-border hover:bg-bg-2 active:bg-bg-1 shadow-sm",
      ghost:
        "text-text-2 hover:text-text-1 hover:bg-white/5 active:bg-white/10",
      icon:
        "h-10 w-10 p-0 text-text-2 hover:text-text-1 hover:bg-white/5 active:bg-white/10 rounded-input",
      danger:
        "bg-danger text-white shadow-md hover:brightness-110 active:brightness-95 shadow-danger/20",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
        ) : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
