"use client";

import { Folders, CheckCircle, Clock, AlertTriangle, AlertOctagon, TrendingUp } from "lucide-react";
import type { DashboardStats } from "@/lib/dashboard/types";

const cards = [
  { key: "total", label: "전체", icon: Folders, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
  { key: "onTrack", label: "순조", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950" },
  { key: "inProgress", label: "진행중", icon: Clock, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950" },
  { key: "atRisk", label: "위험", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950" },
  { key: "overdue", label: "기한초과", icon: AlertOctagon, color: "text-red-700", bg: "bg-red-50 dark:bg-red-950" },
  { key: "avgProgress", label: "평균 진행률", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950" },
] as const;

export function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const value = stats[card.key as keyof DashboardStats];
        const display = card.key === "avgProgress" ? `${value}%` : value;
        return (
          <div
            key={card.key}
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.bg}`}>
              <card.icon size={18} className={card.color} />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">{display}</div>
              <div className="text-[11px] text-[var(--color-muted)]">{card.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
