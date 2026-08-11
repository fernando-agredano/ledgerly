import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200/70 rounded-md",
        className
      )}
    />
  );
}

export function LoadingBlock({
  label = "Cargando datos…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-sm text-slate-500 py-12",
        className
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorBlock({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center py-10 px-6 bg-red-50 border border-red-100 rounded-lg">
      <AlertTriangle className="h-5 w-5 text-red-600" />
      <p className="text-sm font-medium text-red-900">No se pudo cargar la información</p>
      <p className="text-xs text-red-700 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-xs font-medium text-red-700 hover:underline"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
