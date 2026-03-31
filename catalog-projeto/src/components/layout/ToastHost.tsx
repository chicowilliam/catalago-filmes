import { AnimatePresence, motion } from "framer-motion";

interface ToastItem {
  id: number;
  message: string;
  kind: "success" | "info";
}

interface ToastHostProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

export function ToastHost({ toasts, onDismiss }: ToastHostProps) {
  return (
    <div className="toast-host" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            type="button"
            className={`toast-item toast-${toast.kind}`}
            initial={{ opacity: 0, y: 32, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            onClick={() => onDismiss(toast.id)}
            aria-label="Fechar notificação"
          >
            {toast.message}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
