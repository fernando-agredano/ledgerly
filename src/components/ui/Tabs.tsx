import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, active, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 border-b border-slate-200",
        className
      )}
    >
      {items.map((it) => {
        const isActive = it.id === active;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={cn(
              "px-4 h-10 -mb-px border-b-2 text-sm font-medium transition-colors flex items-center gap-2",
              isActive
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-navy-800"
            )}
          >
            {it.label}
            {typeof it.count === "number" && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[20px] px-1.5 h-5 text-[11px] font-semibold rounded-full",
                  isActive
                    ? "bg-brand-100 text-brand-700"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {it.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ children }: { children: ReactNode }) {
  return <div className="pt-6">{children}</div>;
}
