import React from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/cn";

export interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  count?: number | string;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onClick,
  icon,
  count,
  className,
}) => {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-chip text-xs font-medium cursor-pointer transition-all border select-none",
        selected
          ? "bg-primary text-bg-0 border-primary shadow-sm font-semibold"
          : "bg-glass-bg text-text-2 border-glass-border hover:text-text-1 hover:bg-glass-hover",
        className
      )}
    >
      {icon && <span className="w-3.5 h-3.5 flex items-center justify-center">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "ml-0.5 px-1.5 py-0.2 rounded-full text-[10px]",
            selected ? "bg-bg-0/20 text-bg-0" : "bg-white/10 text-text-3"
          )}
        >
          {count}
        </span>
      )}
    </motion.button>
  );
};
