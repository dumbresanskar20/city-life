import React, { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import { useUserStore } from "../store/userStore";

export interface ScoreRingProps {
  score: number; // 0 to 100
  size?: number; // pixel diameter
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 64,
  strokeWidth = 6,
  label,
  className,
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const reduceEffects = useUserStore((s) => s.reduceEffects);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  // Animated counter
  useEffect(() => {
    if (reduceEffects) {
      setDisplayScore(Math.round(clampedScore));
      return;
    }
    const duration = 800;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayScore(Math.round(eased * clampedScore));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [clampedScore, reduceEffects]);

  const getColor = (s: number) => {
    if (s >= 75) return "var(--safe)";
    if (s >= 50) return "var(--caution)";
    return "var(--danger)";
  };

  const strokeColor = getColor(clampedScore);

  return (
    <div className={cn("inline-flex flex-col items-center justify-center select-none", className)}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-white/10"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: reduceEffects ? "none" : "stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold font-mono tracking-tight leading-none text-text-1">
            {displayScore}
          </span>
        </div>
      </div>
      {label && <span className="mt-1 text-[11px] font-medium text-text-3">{label}</span>}
    </div>
  );
};
