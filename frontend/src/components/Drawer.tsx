import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./Button";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = "max-w-md",
  className,
}) => {
  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed inset-y-0 right-0 z-50 w-full flex flex-col bg-bg-1/95 backdrop-blur-xl border-l border-glass-border shadow-2xl overflow-hidden",
              width,
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-glass-border shrink-0">
              <div>
                {title && <h2 className="text-lg font-bold text-text-1">{title}</h2>}
                {subtitle && <p className="text-xs text-text-3">{subtitle}</p>}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close drawer">
                <X className="w-5 h-5 text-text-2" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
