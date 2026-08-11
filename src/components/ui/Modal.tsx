import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Rendered via a portal into <body> — not as a sibling inside whatever
  // wrapper the caller used (often a `space-y-*` container). A fixed
  // element that's still a normal DOM child of a `space-y-*` div inherits
  // the sibling-margin that utility injects, which then offsets its
  // `inset-0` box exactly by that margin. A portal sidesteps the whole
  // class of ancestor-CSS-bleed bugs, not just this one.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/40" onClick={onClose} />
      <div
        className={cn(
          "relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin",
          className
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-navy-900">{title}</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-slate-100 inline-flex items-center justify-center text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
