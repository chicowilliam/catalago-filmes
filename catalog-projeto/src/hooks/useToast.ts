import { useCallback, useState } from "react";

type ToastKind = "success" | "info";

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

const LIFETIME_MS = 2600;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev, { id, message, kind }]);

      window.setTimeout(() => {
        removeToast(id);
      }, LIFETIME_MS);
    },
    [removeToast]
  );

  return { toasts, pushToast, removeToast };
}
