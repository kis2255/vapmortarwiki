"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { DashboardProject, DashboardTask } from "@/lib/dashboard/types";
import { StatusDot } from "./status-dot";

const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const YEAR = 2026;
const TOTAL_DAYS = 365;
const COL_W = 80; // 월별 너비 (px)

function dayOfYear(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (d.getFullYear() !== YEAR) return d.getFullYear() < YEAR ? 0 : TOTAL_DAYS;
  const start = new Date(YEAR, 0, 1);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

function todayOffset(): number {
  return dayOfYear(new Date().toISOString().slice(0, 10)) || 0;
}

const barColors = {
  green: "bg-emerald-500",
  blue: "bg-blue-500",
  red: "bg-red-500",
  none: "bg-gray-400",
  completed: "bg-gray-300 dark:bg-gray-600",
};

function GanttBar({ start, end, color, height = 20 }: { start: string | null; end: string | null; color: string; height?: number }) {
  const s = dayOfYear(start);
  const e = dayOfYear(end);
  if (s === null && e === null) return null;
  const left = ((s ?? (e! - 30)) / TOTAL_DAYS) * COL_W * 12;
  const width = Math.max(((e ?? (s! + 30)) - (s ?? (e! - 30))) / TOTAL_DAYS * COL_W * 12, 8);
  return (
    <div
      className={`absolute rounded-sm ${color}`}
      style={{ left: `${left}px`, width: `${width}px`, height: `${height}px`, top: `${(32 - height) / 2}px` }}
      title={`${start || "?"} ~ ${end || "?"}`}
    />
  );
}

function TaskRow({ task }: { task: DashboardTask }) {
  const color = task.completed ? barColors.completed :
    (task.due_on && new Date(task.due_on) < new Date() ? barColors.red : barColors.blue);
  return (
    <div className="flex border-b border-[var(--color-border)]" style={{ height: 32 }}>
      <div className="sticky left-0 z-10 flex w-[220px] shrink-0 items-center border-r border-[var(--color-border)] bg-[var(--color-surface-hover)] pl-10 pr-2">
        <span className={`truncate text-[11px] ${task.completed ? "text-[var(--color-muted)] line-through" : ""}`}>{task.name}</span>
      </div>
      <div className="sticky left-[220px] z-10 flex w-[50px] shrink-0 items-center justify-center border-r border-[var(--color-border)] bg-[var(--color-surface-hover)]" />
      <div className="relative" style={{ width: `${COL_W * 12}px`, height: 32 }}>
        <GanttBar start={task.start_on} end={task.due_on} color={color} height={14} />
      </div>
    </div>
  );
}

export function GanttChart({ projects, filter }: { projects: DashboardProject[]; filter: { search: string; assignee: string; status: string } }) {
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

  const todayPx = (todayOffset() / TOTAL_DAYS) * COL_W * 12;

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      {/* 헤더 */}
      <div className="flex border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]">
        <div className="sticky left-0 z-20 w-[220px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface-hover)] px-3 py-2 text-[12px] font-semibold">
          프로젝트
        </div>
        <div className="sticky left-[220px] z-20 w-[50px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface-hover)] px-1 py-2 text-center text-[12px] font-semibold">
          상태
        </div>
        <div className="flex" style={{ width: `${COL_W * 12}px` }}>
          {MONTHS.map((m) => (
            <div key={m} className="border-r border-[var(--color-border)] text-center text-[11px] font-medium text-[var(--color-muted)]" style={{ width: COL_W, padding: "8px 0" }}>
              {m}
            </div>
          ))}
        </div>
      </div>

      {/* 본문 */}
      <div className="relative">
        {/* 오늘 수직선 */}
        <div
          className="pointer-events-none absolute z-10 border-l-2 border-red-500"
          style={{ left: `${270 + todayPx}px`, top: 0, bottom: 0 }}
        />

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--color-muted)]">프로젝트가 없습니다</div>
        ) : filtered.map((p) => {
          const isExp = expanded.has(p.gid);
          return (
            <div key={p.gid}>
              {/* 프로젝트 행 */}
              <div className="flex cursor-pointer border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-hover)]" style={{ height: 36 }} onClick={() => toggle(p.gid)}>
                <div className="sticky left-0 z-10 flex w-[220px] shrink-0 items-center gap-1.5 border-r border-[var(--color-border)] bg-[var(--color-surface)] px-3">
                  {p.tasks.length > 0 ? (isExp ? <ChevronDown size={13} className="shrink-0 text-[var(--color-muted)]" /> : <ChevronRight size={13} className="shrink-0 text-[var(--color-muted)]" />) : <span className="w-[13px]" />}
                  <span className="truncate text-[12px] font-medium">{p.name}</span>
                </div>
                <div className="sticky left-[220px] z-10 flex w-[50px] shrink-0 items-center justify-center border-r border-[var(--color-border)] bg-[var(--color-surface)]">
                  <StatusDot status={p.status} />
                </div>
                <div className="relative" style={{ width: `${COL_W * 12}px`, height: 36 }}>
                  <GanttBar start={p.start_on} end={p.due_on} color={barColors[p.status]} />
                </div>
              </div>
              {/* 서브태스크 */}
              {isExp && p.tasks.map((t) => <TaskRow key={t.gid} task={t} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
