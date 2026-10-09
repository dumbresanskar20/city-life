import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "./Button";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}) => {
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 max-h-[85vh] flex flex-col rounded-t-panel bg-bg-1/95 backdrop-blur-xl border-t border-glass-border shadow-2xl lg:hidden",
              className
            )}
          >
            {/* Grab handle */}
            <div className="w-full flex items-center justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>

            <div className="flex items-center justify-between px-4 py-2 border-b border-glass-border">
              {title && <h3 className="font-semibold text-text-1">{title}</h3>}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4 text-text-2" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
