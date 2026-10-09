import React from "react";
import { cn } from "../lib/cn";
import { useUserStore } from "../store/userStore";

export interface ScoreBarProps {
  label: string;
  score: number; // 0 to 100
  icon?: React.ReactNode;
  className?: string;
}

export const ScoreBar: React.FC<ScoreBarProps> = ({
  label,
  score,
  icon,
  className,
}) => {
  const reduceEffects = useUserStore((s) => s.reduceEffects);
  const clamped = Math.min(100, Math.max(0, score));

  const getBarColor = (s: number) => {
    if (s >= 75) return "bg-safe";
    if (s >= 50) return "bg-caution";
    return "bg-danger";
  };

  return (
    <div className={cn("w-full space-y-1 select-none", className)}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-text-2 font-medium">
          {icon && <span className="w-3.5 h-3.5">{icon}</span>}
          <span>{label}</span>
        </div>
        <span className="font-mono font-semibold text-text-1">{Math.round(clamped)}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn("h-full rounded-full", getBarColor(clamped))}
          style={{
            width: `${clamped}%`,
            transition: reduceEffects ? "none" : "width 600ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>
    </div>
  );
};
