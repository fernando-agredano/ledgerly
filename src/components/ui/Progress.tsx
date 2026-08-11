import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0-100
  className?: string;
  tone?: "blue" | "green" | "yellow" | "red";
  showLabel?: boolean;
  size?: "sm" | "md";
}

const tones = {
  blue: "bg-brand-600",
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
};

export function Progress({
  value,
  className,
  tone = "blue",
  showLabel = false,
  size = "md",
}: ProgressProps) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full bg-slate-100 rounded-full overflow-hidden",
          size === "sm" ? "h-1.5" : "h-2"
        )}
      >
        <div
          className={cn("h-full rounded-full transition-all", tones[tone])}
          style={{ width: `${v}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-xs text-slate-500 mt-1">{v}%</div>
      )}
    </div>
  );
}
