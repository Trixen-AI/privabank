import { useCallback, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { ToastContext, type ToastInput } from "./toast-context";

type Toast = ToastInput & { id: number };

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (t: ToastInput) => {
      const id = ++seq;
      setToasts((ts) => [...ts.slice(-3), { ...t, id }]);
      window.setTimeout(() => dismiss(id), t.tone === "bad" ? 9000 : 6000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone ?? "info"}`}>
            <div>
              <strong>{t.title}</strong>
              {t.body ? <p>{t.body}</p> : null}
              {t.href ? (
                <a href={t.href} target="_blank" rel="noopener noreferrer">
                  {t.hrefLabel ?? "View"}
                </a>
              ) : null}
            </div>
            <button type="button" className="icon-btn" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
