"use client";

const statusColors = {
  green: "bg-emerald-500",
  blue: "bg-blue-500",
  red: "bg-red-500",
  none: "bg-gray-400",
};

const statusLabels = {
  green: "순조",
  blue: "진행중",
  red: "위험",
  none: "미설정",
};

export function StatusDot({ status, showLabel = false }: { status: "green" | "blue" | "red" | "none"; showLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${statusColors[status]}`} />
      {showLabel && <span className="text-xs">{statusLabels[status]}</span>}
    </span>
  );
}
