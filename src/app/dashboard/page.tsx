"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Settings, Clock } from "lucide-react";
import type { DashboardProject, DashboardStats } from "@/lib/dashboard/types";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ProjectTable } from "@/components/dashboard/project-table";
import { GanttChart } from "@/components/dashboard/gantt-chart";
import { FilterBar } from "@/components/dashboard/filter-bar";

type Tab = "table" | "gantt";

function computeStats(projects: DashboardProject[]): DashboardStats {
  const today = new Date();
  let onTrack = 0, inProgress = 0, atRisk = 0, overdue = 0, totalProgress = 0;

  for (const p of projects) {
    totalProgress += p.progress;
    if (p.status === "green") onTrack++;
    else if (p.status === "blue") inProgress++;
    else if (p.status === "red") {
      atRisk++;
      if (p.due_on && new Date(p.due_on) < today && p.progress < 100) overdue++;
    }
  }

  return {
    total: projects.length,
    onTrack,
    inProgress,
    atRisk,
    overdue,
    avgProgress: projects.length > 0 ? Math.round(totalProgress / projects.length) : 0,
  };
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [tab, setTab] = useState<Tab>("table");
  const [filter, setFilter] = useState({ search: "", assignee: "", status: "" });
  const [error, setError] = useState<string>("");
  const [tokenMissing, setTokenMissing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/projects");
      const data = await res.json();

      if (data.error) {
        if (data.error.includes("not configured")) {
          setTokenMissing(true);
          setProjects([]);
        } else {
          setError(data.error);
        }
        return;
      }

      setProjects(data);
      setTokenMissing(false);
      setError("");
      setLastUpdated(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      setError("서버 연결 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchData();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch("/api/dashboard/refresh", { method: "POST" });
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  const stats = computeStats(projects);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <RefreshCw size={24} className="animate-spin text-[var(--color-muted)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">PI 프로젝트 현황</h1>
          <p className="mt-0.5 text-[13px] text-[var(--color-muted)]">
            Asana 연동 프로젝트 진행 현황 대시보드
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="flex items-center gap-1 text-[12px] text-[var(--color-muted)]">
              <Clock size={12} /> {lastUpdated} 갱신
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            새로고침
          </button>
        </div>
      </div>

      {/* 토큰 미설정 안내 */}
      {tokenMissing && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800 dark:bg-amber-950">
          <Settings size={20} className="text-amber-600" />
          <div>
            <div className="text-sm font-semibold text-amber-800 dark:text-amber-200">Asana 토큰이 설정되지 않았습니다</div>
            <div className="mt-0.5 text-[13px] text-amber-700 dark:text-amber-300">
              서버 환경변수 <code className="rounded bg-amber-100 px-1 py-0.5 text-[12px] dark:bg-amber-900">ASANA_PAT</code>에 Personal Access Token을 설정해 주세요.
            </div>
          </div>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* 통계 카드 */}
      <StatsCards stats={stats} />

      {/* 필터 */}
      <FilterBar filter={filter} onChange={setFilter} projects={projects} />

      {/* 탭 */}
      <div className="flex gap-1 border-b border-[var(--color-border)]">
        {[
          { key: "table" as Tab, label: "프로젝트 테이블" },
          { key: "gantt" as Tab, label: "간트 차트" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-2 text-[13px] font-medium transition-colors ${
              tab === t.key
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      {tab === "table" ? (
        <ProjectTable projects={projects} filter={filter} />
      ) : (
        <GanttChart projects={projects} filter={filter} />
      )}
    </div>
  );
}
