import React from "react";
import { Button } from "./Button";
import { cn } from "../lib/cn";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      {icon && (
        <div className="w-12 h-12 rounded-full bg-white/5 border border-glass-border flex items-center justify-center mb-3 text-text-3">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-text-1 mb-1">{title}</h3>
      <p className="text-xs text-text-3 max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}) => {
  return (
    <div className={cn("p-6 rounded-card border border-danger/30 bg-danger/10 text-center", className)}>
      <h4 className="text-sm font-semibold text-danger mb-1">{title}</h4>
      <p className="text-xs text-text-2 mb-3">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};
