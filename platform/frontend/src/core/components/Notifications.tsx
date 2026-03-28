import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

export type NotificationType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  type: NotificationType;
  message: string;
  paused: boolean;
}

interface NotificationApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const NotificationContext = createContext<NotificationApi | null>(null);

const AUTO_DISMISS_MS = 4000;

const ICONS: Record<NotificationType, string> = {
  success: "✓",
  error: "✕",
  info: "i",
  warning: "!"
};

export function useNotification(): NotificationApi {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return ctx;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const scheduleRemoval = useCallback((id: number) => {
    const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    timers.current.set(id, timer);
  }, [dismiss]);

  const push = useCallback((type: NotificationType, message: string) => {
    const id = ++nextId.current;
    setToasts((prev) => [...prev, { id, type, message, paused: false }]);
    scheduleRemoval(id);
  }, [scheduleRemoval]);

  const handleMouseEnter = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, paused: true } : t)));
  }, []);

  const handleMouseLeave = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, paused: false } : t)));
    scheduleRemoval(id);
  }, [scheduleRemoval]);

  const api = useRef<NotificationApi>({
    success: (msg) => push("success", msg),
    error: (msg) => push("error", msg),
    info: (msg) => push("info", msg),
    warning: (msg) => push("warning", msg)
  });

  // Keep push reference fresh
  api.current.success = (msg) => push("success", msg);
  api.current.error = (msg) => push("error", msg);
  api.current.info = (msg) => push("info", msg);
  api.current.warning = (msg) => push("warning", msg);

  return (
    <NotificationContext.Provider value={api.current}>
      {children}
      {toasts.length > 0 ? (
        <div className="toast-container" aria-live="polite">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast toast--${toast.type}${toast.paused ? " is-paused" : ""}`}
              role="status"
              onMouseEnter={() => handleMouseEnter(toast.id)}
              onMouseLeave={() => handleMouseLeave(toast.id)}
            >
              <span className="toast__icon">{ICONS[toast.type]}</span>
              <span className="toast__message">{toast.message}</span>
              <button
                type="button"
                className="toast__close"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </NotificationContext.Provider>
  );
}
