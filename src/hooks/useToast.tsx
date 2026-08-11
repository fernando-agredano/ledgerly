import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
}

interface ToastOptions {
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (variant: ToastVariant, title: string, options?: ToastOptions) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let idCounter = 0;

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; iconColor: string; accent: string }
> = {
  success: { icon: CheckCircle2, iconColor: "text-emerald-600", accent: "bg-emerald-500" },
  error: { icon: XCircle, iconColor: "text-red-600", accent: "bg-red-500" },
  info: { icon: Info, iconColor: "text-brand-600", accent: "bg-brand-500" },
  warning: { icon: AlertTriangle, iconColor: "text-amber-600", accent: "bg-amber-500" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (variant: ToastVariant, title: string, options?: ToastOptions) => {
      const id = ++idCounter;
      setToasts((prev) => [
        ...prev,
        { id, variant, title, description: options?.description },
      ]);
      window.setTimeout(() => dismiss(id), options?.duration ?? 4500);
    },
    [dismiss]
  );

  const value: ToastContextValue = {
    showToast,
    success: (title, description) => showToast("success", title, { description }),
    error: (title, description) => showToast("error", title, { description }),
    info: (title, description) => showToast("info", title, { description }),
    warning: (title, description) => showToast("warning", title, { description }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none">
        {toasts.map((t) => {
          const style = VARIANT_STYLES[t.variant];
          const Icon = style.icon;
          return (
            <div
              key={t.id}
              className="toast-enter pointer-events-auto relative flex items-start gap-3 bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-300/30 p-4 pl-5 overflow-hidden"
            >
              <span className={cn("absolute left-0 top-0 bottom-0 w-1", style.accent)} />
              <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", style.iconColor)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy-900">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-slate-400 hover:text-slate-600 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
