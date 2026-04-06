export interface DashboardProject {
  gid: string;
  name: string;
  owner: { gid: string; name: string } | null;
  start_on: string | null;
  due_on: string | null;
  status: "green" | "blue" | "red" | "none";
  total_tasks: number;
  completed_tasks: number;
  progress: number;
  tasks: DashboardTask[];
}

export interface DashboardTask {
  gid: string;
  name: string;
  assignee: { gid: string; name: string } | null;
  start_on: string | null;
  due_on: string | null;
  completed: boolean;
}

export interface DashboardStats {
  total: number;
  onTrack: number;
  inProgress: number;
  atRisk: number;
  overdue: number;
  avgProgress: number;
}

export interface DashboardConfig {
  token_set: boolean;
  token_masked: string;
  refresh_interval_minutes: number;
  workspace: string;
  user_name: string;
}
