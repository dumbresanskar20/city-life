import React from "react";
import { cn } from "../lib/cn";

export interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn("flex p-1 rounded-card bg-bg-2/60 border border-glass-border select-none", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-input transition-all cursor-pointer",
              isActive
                ? "bg-bg-0 text-primary shadow-sm font-semibold"
                : "text-text-2 hover:text-text-1 hover:bg-white/5"
            )}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export interface StepperProps {
  steps: { label: string; description?: string }[];
  currentStep: number;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep, className }) => {
  return (
    <div className={cn("w-full flex items-center justify-between select-none", className)}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;
        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border",
                  isCompleted
                    ? "bg-primary text-bg-0 border-primary"
                    : isCurrent
                    ? "bg-primary/20 text-primary border-primary ring-4 ring-primary/20"
                    : "bg-white/5 text-text-3 border-glass-border"
                )}
              >
                {isCompleted ? "✓" : idx + 1}
              </div>
              <span
                className={cn(
                  "mt-1.5 text-[11px] font-medium hidden sm:block",
                  isCurrent ? "text-primary font-semibold" : "text-text-3"
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 rounded-full transition-colors",
                  idx < currentStep ? "bg-primary" : "bg-white/10"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const Kbd: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <kbd
    className={cn(
      "inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-white/10 text-text-2 border border-white/10 shadow-sm",
      className
    )}
  >
    {children}
  </kbd>
);

export const Avatar: React.FC<{ name?: string; src?: string; size?: number; className?: string }> = ({
  name = "User",
  src,
  size = 32,
  className,
}) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 select-none",
        className
      )}
    >
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initials}
    </div>
  );
};
