"use client";

export function ProgressBar({ value }: { value: number }) {
  const color = value >= 70 ? "bg-emerald-500" : value >= 30 ? "bg-blue-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--color-border)]">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-xs tabular-nums text-[var(--color-muted)]">{value}%</span>
    </div>
  );
}
