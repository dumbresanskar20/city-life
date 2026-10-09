import React from "react";
import { cn } from "../lib/cn";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}) => {
  return (
    <label className={cn("inline-flex items-center gap-3 cursor-pointer select-none", disabled && "opacity-50 cursor-not-allowed", className)}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={cn(
            "w-11 h-6 rounded-full transition-colors",
            checked ? "bg-primary" : "bg-white/15"
          )}
        />
        <div
          className={cn(
            "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-text-1">{label}</span>}
          {description && <span className="text-xs text-text-3">{description}</span>}
        </div>
      )}
    </label>
  );
};

export interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
  label?: string;
  valueFormatter?: (val: number) => string;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  valueFormatter = (v) => `${v}`,
  className,
}) => {
  return (
    <div className={cn("w-full space-y-2 select-none", className)}>
      {(label || valueFormatter) ? (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="font-medium text-text-2">{label}</span>}
          <span className="font-mono text-primary font-semibold">{valueFormatter(value)}</span>
        </div>
      ) : null}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
      />
    </div>
  );
};
