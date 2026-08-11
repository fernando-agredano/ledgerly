import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone =
  | "neutral"
  | "blue"
  | "green"
  | "yellow"
  | "red"
  | "navy"
  | "violet";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  blue: "bg-brand-50 text-brand-700 ring-brand-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  yellow: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  navy: "bg-navy-50 text-navy-800 ring-navy-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
};

const dotColors: Record<Tone, string> = {
  neutral: "bg-slate-400",
  blue: "bg-brand-500",
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
  navy: "bg-navy-700",
  violet: "bg-violet-500",
};

export function Badge({
  className,
  tone = "neutral",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[tone])} />
      )}
      {children}
    </span>
  );
}
