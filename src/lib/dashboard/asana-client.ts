import type { DashboardProject, DashboardTask } from "./types";

const ASANA_BASE = "https://app.asana.com/api/1.0";

// ── 메모리 캐시 ──
let cachedProjects: DashboardProject[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = parseInt(process.env.ASANA_CACHE_TTL || "300") * 1000;

function getToken(): string {
  return process.env.ASANA_PAT || "";
}

async function asanaFetch(path: string) {
  const token = getToken();
  if (!token) throw new Error("ASANA_PAT not configured");

  const res = await fetch(`${ASANA_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (res.status === 401) throw new Error("Invalid Asana token");
  if (res.status === 429) {
    const retry = res.headers.get("Retry-After") || "60";
    throw new Error(`Rate limited. Retry after ${retry}s`);
  }
  if (!res.ok) throw new Error(`Asana API error: ${res.status}`);

  const data = await res.json();
  return data.data;
}

function getProjectStatus(
  project: { current_status_update?: { color?: string } | null },
  progress: number,
  dueOn: string | null
): "green" | "blue" | "red" | "none" {
  const color = project.current_status_update?.color;
  if (color === "green" || color === "blue" || color === "red") return color;

  const today = new Date();
  if (dueOn) {
    const due = new Date(dueOn);
    if (due < today && progress < 100) return "red";
    const daysLeft = (due.getTime() - today.getTime()) / 86400000;
    if (daysLeft <= 30 && progress < 50) return "red";
  }
  if (progress >= 50) return "green";
  if (progress > 0) return "blue";
  return "none";
}

export async function fetchProjects(force = false): Promise<DashboardProject[]> {
  if (!force && cachedProjects && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedProjects;
  }

  const token = getToken();
  if (!token) return [];

  // 워크스페이스 조회
  let workspaceGid = process.env.ASANA_WORKSPACE_GID;
  if (!workspaceGid || workspaceGid === "auto") {
    const workspaces = await asanaFetch("/workspaces?limit=1");
    if (!workspaces?.length) throw new Error("No workspace found");
    workspaceGid = workspaces[0].gid;
  }

  // 프로젝트 목록
  const rawProjects = await asanaFetch(
    `/projects?workspace=${workspaceGid}&archived=false&limit=100` +
    `&opt_fields=name,owner,owner.name,start_on,due_on,` +
    `current_status_update,current_status_update.color,` +
    `num_tasks,num_incomplete_tasks,num_completed_tasks`
  );

  const projects: DashboardProject[] = [];

  for (const p of rawProjects || []) {
    const totalTasks = (p.num_completed_tasks || 0) + (p.num_incomplete_tasks || 0);
    const completedTasks = p.num_completed_tasks || 0;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 태스크 조회
    let tasks: DashboardTask[] = [];
    try {
      const rawTasks = await asanaFetch(
        `/tasks?project=${p.gid}&limit=100` +
        `&opt_fields=name,assignee,assignee.name,start_on,due_on,completed`
      );
      tasks = (rawTasks || []).map((t: Record<string, unknown>) => ({
        gid: t.gid as string,
        name: t.name as string,
        assignee: t.assignee as DashboardTask["assignee"],
        start_on: t.start_on as string | null,
        due_on: t.due_on as string | null,
        completed: t.completed as boolean,
      }));
    } catch {
      // 태스크 조회 실패 시 빈 배열
    }

    projects.push({
      gid: p.gid,
      name: p.name,
      owner: p.owner ? { gid: p.owner.gid, name: p.owner.name } : null,
      start_on: p.start_on,
      due_on: p.due_on,
      status: getProjectStatus(p, progress, p.due_on),
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      progress,
      tasks,
    });
  }

  cachedProjects = projects;
  cacheTimestamp = Date.now();
  return projects;
}

export function invalidateCache() {
  cachedProjects = null;
  cacheTimestamp = 0;
}

export async function verifyToken(token: string) {
  const res = await fetch(`${ASANA_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}
