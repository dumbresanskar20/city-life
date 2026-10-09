import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useToastStore, type ToastItem } from "../store/toastStore";
import { cn } from "../lib/cn";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  const getIcon = (type: ToastItem["type"]) => {
    switch (type) {
      case "safe":
        return <CheckCircle2 className="w-4 h-4 text-safe shrink-0" />;
      case "caution":
        return <AlertTriangle className="w-4 h-4 text-caution shrink-0" />;
      case "danger":
        return <AlertCircle className="w-4 h-4 text-danger shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-info shrink-0" />;
    }
  };

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className={cn(
              "pointer-events-auto p-3.5 rounded-card bg-bg-1/95 backdrop-blur-xl border border-glass-border shadow-xl flex items-start gap-3",
              toast.type === "safe" && "border-safe/30",
              toast.type === "caution" && "border-caution/30",
              toast.type === "danger" && "border-danger/30"
            )}
          >
            {getIcon(toast.type)}
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-semibold text-text-1">{toast.title}</h5>
              {toast.message && <p className="text-xs text-text-2 mt-0.5 leading-snug">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-text-3 hover:text-text-1 transition-colors p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
