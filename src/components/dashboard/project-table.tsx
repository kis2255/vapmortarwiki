"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import type { DashboardProject } from "@/lib/dashboard/types";
import { StatusDot } from "./status-dot";
import { ProgressBar } from "./progress-bar";

function AssigneeBadge({ name }: { name: string }) {
  const colors: Record<string, string> = {
    "이": "bg-blue-600", "김": "bg-red-600", "채": "bg-green-600",
    "권": "bg-yellow-500 text-gray-900", "박": "bg-purple-600",
  };
  const initial = name.charAt(0);
  const bg = colors[initial] || "bg-gray-500";
  return (
    <span title={name} className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${bg}`}>
      {initial}
    </span>
  );
}

function isOverdue(dueOn: string | null) {
  if (!dueOn) return false;
  return new Date(dueOn) < new Date();
}

function formatShortDate(d: string | null) {
  if (!d) return "-";
  const date = new Date(d);
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ProjectTable({ projects, filter }: { projects: DashboardProject[]; filter: { search: string; assignee: string; status: string } }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = projects.filter((p) => {
    if (filter.search && !p.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
    if (filter.assignee && p.owner?.name !== filter.assignee) return false;
    if (filter.status && p.status !== filter.status) return false;
    return true;
  });

  const toggle = (gid: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(gid) ? next.delete(gid) : next.add(gid);
      return next;
    });
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]">
            <th className="w-8 px-3 py-2.5" />
            <th className="px-3 py-2.5 text-left font-semibold">프로젝트명</th>
            <th className="px-3 py-2.5 text-center font-semibold">상태</th>
            <th className="px-3 py-2.5 text-left font-semibold">진행률</th>
            <th className="px-3 py-2.5 text-center font-semibold">태스크</th>
            <th className="px-3 py-2.5 text-center font-semibold">시작일</th>
            <th className="px-3 py-2.5 text-center font-semibold">완료기한</th>
            <th className="px-3 py-2.5 text-center font-semibold">담당자</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={8} className="py-12 text-center text-sm text-[var(--color-muted)]">프로젝트가 없습니다</td></tr>
          ) : filtered.map((p) => {
            const isExp = expanded.has(p.gid);
            const overdue = isOverdue(p.due_on) && p.progress < 100;
            return (
              <tbody key={p.gid}>
                <tr
                  className="cursor-pointer border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-hover)]"
                  onClick={() => toggle(p.gid)}
                >
                  <td className="px-3 py-2.5 text-[var(--color-muted)]">
                    {p.tasks.length > 0 && (isExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                  </td>
                  <td className="px-3 py-2.5 font-medium">{p.name}</td>
                  <td className="px-3 py-2.5 text-center"><StatusDot status={p.status} /></td>
                  <td className="px-3 py-2.5"><ProgressBar value={p.progress} /></td>
                  <td className="px-3 py-2.5 text-center text-[var(--color-muted)]">{p.completed_tasks}/{p.total_tasks}</td>
                  <td className="px-3 py-2.5 text-center tabular-nums">{formatShortDate(p.start_on)}</td>
                  <td className={`px-3 py-2.5 text-center tabular-nums ${overdue ? "font-semibold text-[var(--color-danger)]" : ""}`}>
                    {formatShortDate(p.due_on)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {p.owner ? <AssigneeBadge name={p.owner.name} /> : <span className="text-[var(--color-muted)]">-</span>}
                  </td>
                </tr>
                {isExp && p.tasks.map((t) => {
                  const taskOverdue = !t.completed && isOverdue(t.due_on);
                  return (
                    <tr key={t.gid} className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]">
                      <td />
                      <td className="py-2 pl-10 pr-3">
                        <span className="flex items-center gap-2 text-[12px]">
                          {t.completed ? <CheckCircle2 size={13} className="text-emerald-500" /> :
                            taskOverdue ? <AlertCircle size={13} className="text-red-500" /> :
                            <Circle size={13} className="text-[var(--color-muted)]" />}
                          <span className={t.completed ? "text-[var(--color-muted)] line-through" : ""}>{t.name}</span>
                        </span>
                      </td>
                      <td />
                      <td />
                      <td />
                      <td className="py-2 text-center text-[11px] tabular-nums text-[var(--color-muted)]">{formatShortDate(t.start_on)}</td>
                      <td className={`py-2 text-center text-[11px] tabular-nums ${taskOverdue ? "font-semibold text-[var(--color-danger)]" : "text-[var(--color-muted)]"}`}>
                        {formatShortDate(t.due_on)}
                      </td>
                      <td className="py-2 text-center">
                        {t.assignee ? <AssigneeBadge name={t.assignee.name} /> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
