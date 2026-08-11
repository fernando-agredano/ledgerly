import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Table({
  className,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <table
        className={cn("w-full text-sm border-collapse", className)}
        {...props}
      />
    </div>
  );
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "text-xs uppercase tracking-wider text-slate-500 bg-slate-50/70",
        className
      )}
      {...props}
    />
  );
}

export function TBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-slate-100", className)} {...props} />;
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("hover:bg-slate-50/60 transition-colors", className)}
      {...props}
    />
  );
}

export function TH({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "text-left font-medium px-4 py-3 whitespace-nowrap",
        className
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-4 py-3 text-navy-900 align-middle", className)}
      {...props}
    />
  );
}
