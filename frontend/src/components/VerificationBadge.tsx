import React, { useState } from "react";
import { ShieldCheck, Users, HelpCircle, Landmark } from "lucide-react";
import { cn } from "../lib/cn";

export type VerificationStatus = "unverified" | "community" | "ai_verified" | "official";

export interface VerificationBadgeProps {
  status: VerificationStatus | string;
  reasons?: string[];
  credibilityScore?: number;
  className?: string;
  showTooltip?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status,
  reasons = [],
  credibilityScore,
  className,
  showTooltip = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const config = {
    ai_verified: {
      label: "AI-verified",
      icon: <ShieldCheck className="w-3.5 h-3.5 text-primary" />,
      colorClass: "bg-primary/10 text-primary border-primary/30",
    },
    community: {
      label: "Community-verified",
      icon: <Users className="w-3.5 h-3.5 text-caution" />,
      colorClass: "bg-caution/10 text-caution border-caution/30",
    },
    official: {
      label: "Official Data",
      icon: <Landmark className="w-3.5 h-3.5 text-secondary" />,
      colorClass: "bg-secondary/10 text-secondary border-secondary/30",
    },
    unverified: {
      label: "Unverified",
      icon: <HelpCircle className="w-3.5 h-3.5 text-text-3" />,
      colorClass: "bg-white/5 text-text-3 border-white/10",
    },
  }[status] || {
    label: "Unverified",
    icon: <HelpCircle className="w-3.5 h-3.5 text-text-3" />,
    colorClass: "bg-white/5 text-text-3 border-white/10",
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-help",
          config.colorClass,
          className
        )}
      >
        {config.icon}
        <span>{config.label}</span>
        {credibilityScore !== undefined && (
          <span className="opacity-80 text-[10px] font-mono">({Math.round(credibilityScore)})</span>
        )}
      </button>

      {/* Tooltip explaining why & reasons[] */}
      {showTooltip && isOpen && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-64 p-3 rounded-card bg-bg-1 border border-glass-border shadow-lg text-xs animate-in fade-in zoom-in-95 pointer-events-none">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
            <span className="font-semibold text-text-1 flex items-center gap-1">
              {config.icon} {config.label}
            </span>
            {credibilityScore !== undefined && (
              <span className="font-mono text-primary font-semibold">{Math.round(credibilityScore)}/100</span>
            )}
          </div>
          {reasons && reasons.length > 0 ? (
            <div className="space-y-1">
              <span className="text-text-3 text-[10px] font-semibold uppercase tracking-wider">Verification Rationale</span>
              <ul className="list-disc pl-3 space-y-0.5 text-text-2">
                {reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-text-3">
              {status === "unverified"
                ? "This report is currently pending corroboration by nearby citizens or sensor data."
                : "Verified through cross-validation of location, sensors, and corroborating reports."}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
