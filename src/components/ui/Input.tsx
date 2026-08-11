import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-navy-800 block">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full h-10 px-3 rounded-lg border bg-white text-sm",
            "border-slate-300 placeholder:text-slate-400",
            "focus:border-brand-500 focus:ring-2 focus:ring-brand-200",
            "transition-colors",
            error && "border-red-400 focus:border-red-500 focus:ring-red-200",
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-slate-500">{hint}</p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
