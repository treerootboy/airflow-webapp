// Airflow DAG types
export interface DAG {
  dag_id: string;
  description: string | null;
  file_token: string;
  fileloc: string;
  is_active: boolean;
  is_paused: boolean;
  is_subdag: boolean;
  last_expired: string | null;
  last_parsed_time: string | null;
  last_pickled: string | null;
  max_active_runs: number;
  max_active_tasks: number;
  next_dagrun: string | null;
  next_dagrun_create_after: string | null;
  next_dagrun_data_interval_end: string | null;
  next_dagrun_data_interval_start: string | null;
  owners: string[];
  pickle_id: string | null;
  root_dag_id: string | null;
  schedule_interval: ScheduleInterval | null;
  scheduler_lock: string | null;
  tags: DAGTag[];
  timetable_description: string | null;
}

export interface ScheduleInterval {
  __type: string;
  value: string;
}

export interface DAGTag {
  name: string;
}

// DAG Run types
export interface DAGRun {
  conf: Record<string, unknown>;
  dag_id: string;
  dag_run_id: string;
  data_interval_end: string | null;
  data_interval_start: string | null;
  end_date: string | null;
  execution_date: string;
  external_trigger: boolean;
  last_scheduling_decision: string | null;
  logical_date: string;
  note: string | null;
  run_type: "scheduled" | "manual" | "backfill";
  start_date: string | null;
  state: DAGRunState;
}

export type DAGRunState = "queued" | "running" | "success" | "failed";

// Task types
export interface TaskInstance {
  dag_id: string;
  dag_run_id: string;
  duration: number | null;
  end_date: string | null;
  execution_date: string;
  executor_config: string;
  hostname: string;
  map_index: number;
  max_tries: number;
  note: string | null;
  operator: string;
  pid: number | null;
  pool: string;
  pool_slots: number;
  priority_weight: number;
  queue: string;
  queued_when: string | null;
  rendered_fields: Record<string, unknown>;
  sla_miss: SLAMiss | null;
  start_date: string | null;
  state: TaskState;
  task_id: string;
  trigger: Trigger | null;
  triggerer_job: string | null;
  try_number: number;
  unixname: string;
}

export type TaskState =
  | "success"
  | "running"
  | "failed"
  | "upstream_failed"
  | "skipped"
  | "up_for_retry"
  | "up_for_reschedule"
  | "queued"
  | "no_status"
  | "scheduled"
  | "deferred"
  | "removed"
  | null;

export interface SLAMiss {
  dag_id: string;
  description: string | null;
  email_sent: boolean;
  execution_date: string;
  notification_sent: boolean;
  task_id: string;
  timestamp: string;
}

export interface Trigger {
  classpath: string;
  created_date: string;
  id: number;
  kwargs: string;
}

// Notification types
export interface Notification {
  id: string;
  dag_id: string;
  type: "error" | "warning" | "info" | "success";
  message: string;
  timestamp: string;
  read: boolean;
}

export interface NotificationSettings {
  dag_id: string;
  enabled: boolean;
  on_success: boolean;
  on_failure: boolean;
  on_retry: boolean;
}

// User types
export interface User {
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  roles: Role[];
}

export interface Role {
  name: string;
}

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

// API Response types
export interface DAGListResponse {
  dags: DAG[];
  total_entries: number;
}

export interface DAGRunListResponse {
  dag_runs: DAGRun[];
  total_entries: number;
}

export interface TaskInstanceListResponse {
  task_instances: TaskInstance[];
  total_entries: number;
}

// Log types
export interface TaskLog {
  continuation_token: string;
  content: string;
}
