"use client";

import { useState, useEffect, useCallback } from "react";
import { DAG, DAGRun, TaskInstance } from "@/types/airflow";
import {
  fetchDAGs,
  fetchDAG,
  toggleDAGPause,
  fetchDAGRuns,
  triggerDAGRun,
  fetchTaskInstances,
  clearTaskInstance,
  setTaskInstanceState,
  fetchTaskLogs,
  AirflowApiError,
} from "@/lib/airflowApi";

export function useDAGs() {
  const [dags, setDAGs] = useState<DAG[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDAGs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchDAGs();
      setDAGs(response.dags);
      setError(null);
    } catch (err) {
      if (err instanceof AirflowApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch DAGs");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDAGs();
  }, [loadDAGs]);

  const togglePause = useCallback(async (dagId: string, isPaused: boolean) => {
    try {
      const updatedDAG = await toggleDAGPause(dagId, isPaused);
      setDAGs((prev) =>
        prev.map((dag) =>
          dag.dag_id === dagId ? { ...dag, is_paused: updatedDAG.is_paused } : dag
        )
      );
    } catch (err) {
      console.error("Failed to toggle pause:", err);
      throw err;
    }
  }, []);

  const refresh = useCallback(() => {
    loadDAGs();
  }, [loadDAGs]);

  return { dags, loading, error, togglePause, refresh };
}

export function useDAG(dagId: string) {
  const [dag, setDAG] = useState<DAG | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDAG = useCallback(async () => {
    if (!dagId) return;
    
    setLoading(true);
    try {
      const data = await fetchDAG(dagId);
      setDAG(data);
      setError(null);
    } catch (err) {
      if (err instanceof AirflowApiError) {
        if (err.status === 404) {
          setError("DAG not found");
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch DAG");
      }
    } finally {
      setLoading(false);
    }
  }, [dagId]);

  useEffect(() => {
    loadDAG();
  }, [loadDAG]);

  const togglePause = useCallback(async (isPaused: boolean) => {
    if (!dag) return;
    
    try {
      const updatedDAG = await toggleDAGPause(dag.dag_id, isPaused);
      setDAG(updatedDAG);
    } catch (err) {
      console.error("Failed to toggle pause:", err);
      throw err;
    }
  }, [dag]);

  const refresh = useCallback(() => {
    loadDAG();
  }, [loadDAG]);

  return { dag, loading, error, togglePause, refresh };
}

export function useDAGRuns(dagId: string) {
  const [runs, setRuns] = useState<DAGRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    if (!dagId) return;
    
    setLoading(true);
    try {
      const response = await fetchDAGRuns(dagId);
      setRuns(response.dag_runs);
      setError(null);
    } catch (err) {
      if (err instanceof AirflowApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch DAG runs");
      }
    } finally {
      setLoading(false);
    }
  }, [dagId]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const triggerRun = useCallback(async (conf: Record<string, unknown> = {}) => {
    try {
      const newRun = await triggerDAGRun(dagId, conf);
      setRuns((prev) => [newRun, ...prev]);
      return newRun;
    } catch (err) {
      console.error("Failed to trigger DAG run:", err);
      throw err;
    }
  }, [dagId]);

  const refresh = useCallback(() => {
    loadRuns();
  }, [loadRuns]);

  return { runs, loading, error, triggerRun, refresh };
}

export function useTaskInstances(dagId: string, runId: string) {
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    if (!dagId || !runId) return;
    
    setLoading(true);
    try {
      const response = await fetchTaskInstances(dagId, runId);
      setTasks(response.task_instances);
      setError(null);
    } catch (err) {
      if (err instanceof AirflowApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch task instances");
      }
    } finally {
      setLoading(false);
    }
  }, [dagId, runId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const clearTask = useCallback(async (taskId: string) => {
    try {
      await clearTaskInstance(dagId, runId, taskId);
      // Refresh tasks after clearing
      loadTasks();
    } catch (err) {
      console.error("Failed to clear task:", err);
      throw err;
    }
  }, [dagId, runId, loadTasks]);

  const markSuccess = useCallback(async (taskId: string) => {
    try {
      const updated = await setTaskInstanceState(dagId, runId, taskId, "success");
      setTasks((prev) =>
        prev.map((task) =>
          task.task_id === taskId ? { ...task, state: updated.state } : task
        )
      );
    } catch (err) {
      console.error("Failed to mark task as success:", err);
      throw err;
    }
  }, [dagId, runId]);

  const markFailed = useCallback(async (taskId: string) => {
    try {
      const updated = await setTaskInstanceState(dagId, runId, taskId, "failed");
      setTasks((prev) =>
        prev.map((task) =>
          task.task_id === taskId ? { ...task, state: updated.state } : task
        )
      );
    } catch (err) {
      console.error("Failed to mark task as failed:", err);
      throw err;
    }
  }, [dagId, runId]);

  const refresh = useCallback(() => {
    loadTasks();
  }, [loadTasks]);

  return { tasks, loading, error, clearTask, markSuccess, markFailed, refresh };
}

export function useTaskLogs(dagId: string, runId: string, taskId: string, tryNumber: number = 1) {
  const [logs, setLogs] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    if (!dagId || !runId || !taskId) return;
    
    setLoading(true);
    try {
      const content = await fetchTaskLogs(dagId, runId, taskId, tryNumber);
      setLogs(content);
      setError(null);
    } catch (err) {
      if (err instanceof AirflowApiError) {
        setError(err.message);
        // Only show fallback message for 404 (logs not found) errors
        if (err.status === 404) {
          setLogs("No logs available for this task.");
        }
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch logs");
      }
    } finally {
      setLoading(false);
    }
  }, [dagId, runId, taskId, tryNumber]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const refresh = useCallback(() => {
    loadLogs();
  }, [loadLogs]);

  return { logs, loading, error, refresh };
}
