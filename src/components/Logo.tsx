import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const iconSizeClasses: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "h-6 w-6",
  md: "h-7 w-7",
  lg: "h-11 w-11",
};

const textSizeClasses: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
};

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={4.5}
        strokeLinecap="round"
        className={cn("text-brand-600 flex-shrink-0", iconSizeClasses[size])}
      >
        <path d="M4 20V13" />
        <path d="M12 20V8" />
        <path d="M20 20V4" />
      </svg>
      {showText && (
        <span
          className={cn(
            "font-black tracking-wide leading-snug truncate select-none py-0.5",
            textSizeClasses[size],
            className || "text-navy-900"
          )}
        >
          Ledger<span className="text-brand-600">ly</span>
        </span>
      )}
    </div>
  );
}
