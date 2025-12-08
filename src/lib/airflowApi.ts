"use client";

import {
  DAG,
  DAGListResponse,
  DAGRun,
  DAGRunListResponse,
  TaskInstance,
  TaskInstanceListResponse,
  User,
} from "@/types/airflow";

// API Error class
export class AirflowApiError extends Error {
  status: number;
  statusText: string;

  constructor(message: string, status: number, statusText: string) {
    super(message);
    this.name = "AirflowApiError";
    this.status = status;
    this.statusText = statusText;
  }
}

// Get auth token and base URL from localStorage
function getAuthConfig(): { baseUrl: string; token: string } | null {
  if (typeof window === "undefined") {
    return null;
  }
  
  const baseUrl = localStorage.getItem("airflow_baseurl");
  const token = localStorage.getItem("airflow_token");
  
  if (!baseUrl || !token) {
    return null;
  }
  
  return { baseUrl, token };
}

// Create headers for direct API requests to Airflow server
function createHeaders(token: string): HeadersInit {
  return {
    "Authorization": `Basic ${token}`,
    "Content-Type": "application/json",
  };
}

// Generic fetch wrapper with error handling - makes direct requests to Airflow API
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getAuthConfig();
  
  if (!config) {
    throw new AirflowApiError("Not authenticated", 401, "Unauthorized");
  }
  
  const { baseUrl, token } = config;
  // Make direct request to Airflow API
  const url = `${baseUrl.replace(/\/$/, "")}/api/v1${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...createHeaders(token),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new AirflowApiError(
      `API Error: ${response.status} - ${errorText}`,
      response.status,
      response.statusText
    );
  }
  
  return response.json();
}

// ==================== Authentication API ====================

/**
 * Login function that authenticates the user and establishes a session
 * This function performs the actual login operation by:
 * 1. Attempting to authenticate with a login endpoint (if available)
 * 2. Validating credentials by fetching user information
 */
export async function login(
  baseUrl: string,
  username: string,
  password: string
): Promise<{ user: User; token: string }> {
  const token = btoa(`${username}:${password}`);
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  
  // Attempt to establish a session by calling the login endpoint
  // This is important for proper authentication flow
  try {
    const loginUrl = `${cleanBaseUrl}/login`;
    const loginResponse = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username,
        password,
      }),
      credentials: "include", // Important for session cookies
    });
    
    // If login endpoint exists and succeeds, proceed with user info fetch
    // Note: Some Airflow instances may not have this endpoint or may return redirects
    // which is acceptable - we still need to validate with the API
  } catch (error) {
    // Login endpoint may not exist or may not be accessible
    // Continue with API validation
    console.log("Login endpoint not available, proceeding with API validation");
  }
  
  // Validate credentials by fetching user information from the API
  // This confirms the user exists and credentials are correct
  const userUrl = `${cleanBaseUrl}/api/v1/users/${encodeURIComponent(username)}`;
  
  const userResponse = await fetch(userUrl, {
    headers: {
      "Authorization": `Basic ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for session management
  });
  
  if (!userResponse.ok) {
    const errorText = await userResponse.text().catch(() => "Unknown error");
    throw new AirflowApiError(
      `Authentication failed: ${userResponse.status} - ${errorText}`,
      userResponse.status,
      userResponse.statusText
    );
  }
  
  const user = await userResponse.json();
  
  return { user, token };
}

export async function validateCredentials(
  baseUrl: string,
  username: string,
  password: string
): Promise<User> {
  const { user } = await login(baseUrl, username, password);
  return user;
}

// ==================== DAG API ====================

export async function fetchDAGs(
  limit: number = 100,
  offset: number = 0
): Promise<DAGListResponse> {
  return apiFetch<DAGListResponse>(`/dags?limit=${limit}&offset=${offset}`);
}

export async function fetchDAG(dagId: string): Promise<DAG> {
  return apiFetch<DAG>(`/dags/${encodeURIComponent(dagId)}`);
}

export async function updateDAG(
  dagId: string,
  data: Partial<DAG>
): Promise<DAG> {
  return apiFetch<DAG>(`/dags/${encodeURIComponent(dagId)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function toggleDAGPause(
  dagId: string,
  isPaused: boolean
): Promise<DAG> {
  return updateDAG(dagId, { is_paused: isPaused });
}

// ==================== DAG Run API ====================

export async function fetchDAGRuns(
  dagId: string,
  limit: number = 25,
  offset: number = 0
): Promise<DAGRunListResponse> {
  return apiFetch<DAGRunListResponse>(
    `/dags/${encodeURIComponent(dagId)}/dagRuns?limit=${limit}&offset=${offset}&order_by=-execution_date`
  );
}

export async function fetchDAGRun(
  dagId: string,
  dagRunId: string
): Promise<DAGRun> {
  return apiFetch<DAGRun>(
    `/dags/${encodeURIComponent(dagId)}/dagRuns/${encodeURIComponent(dagRunId)}`
  );
}

export async function triggerDAGRun(
  dagId: string,
  conf: Record<string, unknown> = {},
  logicalDate?: string
): Promise<DAGRun> {
  const body: Record<string, unknown> = { conf };
  if (logicalDate) {
    body.logical_date = logicalDate;
  }
  
  return apiFetch<DAGRun>(`/dags/${encodeURIComponent(dagId)}/dagRuns`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ==================== Task Instance API ====================

export async function fetchTaskInstances(
  dagId: string,
  dagRunId: string,
  limit: number = 100,
  offset: number = 0
): Promise<TaskInstanceListResponse> {
  return apiFetch<TaskInstanceListResponse>(
    `/dags/${encodeURIComponent(dagId)}/dagRuns/${encodeURIComponent(dagRunId)}/taskInstances?limit=${limit}&offset=${offset}`
  );
}

export async function fetchTaskInstance(
  dagId: string,
  dagRunId: string,
  taskId: string
): Promise<TaskInstance> {
  return apiFetch<TaskInstance>(
    `/dags/${encodeURIComponent(dagId)}/dagRuns/${encodeURIComponent(dagRunId)}/taskInstances/${encodeURIComponent(taskId)}`
  );
}

export async function clearTaskInstance(
  dagId: string,
  dagRunId: string,
  taskId: string
): Promise<TaskInstance[]> {
  const response = await apiFetch<{ task_instances: TaskInstance[] }>(
    `/dags/${encodeURIComponent(dagId)}/clearTaskInstances`,
    {
      method: "POST",
      body: JSON.stringify({
        dag_run_id: dagRunId,
        task_ids: [taskId],
        include_downstream: false,
        include_upstream: false,
        reset_dag_runs: false,
      }),
    }
  );
  return response.task_instances;
}

export async function setTaskInstanceState(
  dagId: string,
  dagRunId: string,
  taskId: string,
  state: "success" | "failed"
): Promise<TaskInstance> {
  return apiFetch<TaskInstance>(
    `/dags/${encodeURIComponent(dagId)}/dagRuns/${encodeURIComponent(dagRunId)}/taskInstances/${encodeURIComponent(taskId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        state,
      }),
    }
  );
}

// ==================== Task Log API ====================

export async function fetchTaskLogs(
  dagId: string,
  dagRunId: string,
  taskId: string,
  taskTryNumber: number = 1
): Promise<string> {
  const config = getAuthConfig();
  
  if (!config) {
    throw new AirflowApiError("Not authenticated", 401, "Unauthorized");
  }
  
  const { baseUrl, token } = config;
  const endpoint = `/dags/${encodeURIComponent(dagId)}/dagRuns/${encodeURIComponent(dagRunId)}/taskInstances/${encodeURIComponent(taskId)}/logs/${taskTryNumber}`;
  // Make direct request to Airflow API
  const url = `${baseUrl.replace(/\/$/, "")}/api/v1${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Basic ${token}`,
      "Accept": "text/plain",
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new AirflowApiError(
      `Failed to fetch logs: ${response.status} - ${errorText}`,
      response.status,
      response.statusText
    );
  }
  
  return response.text();
}
