"use client";

import { Search } from "lucide-react";
import type { DashboardProject } from "@/lib/dashboard/types";

interface FilterBarProps {
  filter: { search: string; assignee: string; status: string };
  onChange: (filter: { search: string; assignee: string; status: string }) => void;
  projects: DashboardProject[];
}

export function FilterBar({ filter, onChange, projects }: FilterBarProps) {
  const assignees = Array.from(new Set(projects.map((p) => p.owner?.name).filter(Boolean) as string[])).sort();
  const statuses = [
    { value: "", label: "전체 상태" },
    { value: "green", label: "순조" },
    { value: "blue", label: "진행중" },
    { value: "red", label: "위험" },
    { value: "none", label: "미설정" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 sm:max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
        <input
          type="text"
          placeholder="프로젝트 검색..."
          value={filter.search}
          onChange={(e) => onChange({ ...filter, search: e.target.value })}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>
      <select
        value={filter.assignee}
        onChange={(e) => onChange({ ...filter, assignee: e.target.value })}
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      >
        <option value="">전체 담당자</option>
        {assignees.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>
      <select
        value={filter.status}
        onChange={(e) => onChange({ ...filter, status: e.target.value })}
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      >
        {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    </div>
  );
}
