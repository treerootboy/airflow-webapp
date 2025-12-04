"use client";

import { useState, useEffect, useCallback } from "react";
import { DAG, DAGRun, TaskInstance } from "@/types/airflow";
import { mockDAGs, mockDAGRuns, mockTaskInstances, mockTaskLogs } from "@/lib/mockData";

export function useDAGs() {
  const [dags, setDAGs] = useState<DAG[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    const fetchDAGs = async () => {
      setLoading(true);
      try {
        // In production, this would be: fetch('/api/v1/dags')
        await new Promise((resolve) => setTimeout(resolve, 500));
        setDAGs(mockDAGs);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch DAGs");
      } finally {
        setLoading(false);
      }
    };

    fetchDAGs();
  }, []);

  const togglePause = useCallback(async (dagId: string, isPaused: boolean) => {
    // In production, this would call PATCH /api/v1/dags/{dag_id}
    setDAGs((prev) =>
      prev.map((dag) =>
        dag.dag_id === dagId ? { ...dag, is_paused: isPaused } : dag
      )
    );
  }, []);

  return { dags, loading, error, togglePause };
}

export function useDAG(dagId: string) {
  const [dag, setDAG] = useState<DAG | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDAG = async () => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const foundDAG = mockDAGs.find((d) => d.dag_id === dagId);
        if (foundDAG) {
          setDAG(foundDAG);
          setError(null);
        } else {
          setError("DAG not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch DAG");
      } finally {
        setLoading(false);
      }
    };

    if (dagId) {
      fetchDAG();
    }
  }, [dagId]);

  const togglePause = useCallback(async (isPaused: boolean) => {
    if (dag) {
      setDAG({ ...dag, is_paused: isPaused });
    }
  }, [dag]);

  return { dag, loading, error, togglePause };
}

export function useDAGRuns(dagId: string) {
  const [runs, setRuns] = useState<DAGRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRuns = async () => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 400));
        setRuns(mockDAGRuns[dagId] || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch DAG runs");
      } finally {
        setLoading(false);
      }
    };

    if (dagId) {
      fetchRuns();
    }
  }, [dagId]);

  const triggerRun = useCallback(async (conf: Record<string, unknown> = {}) => {
    // In production, this would call POST /api/v1/dags/{dag_id}/dagRuns
    const newRun: DAGRun = {
      conf,
      dag_id: dagId,
      dag_run_id: `manual__${new Date().toISOString()}`,
      data_interval_end: null,
      data_interval_start: null,
      end_date: null,
      execution_date: new Date().toISOString(),
      external_trigger: true,
      last_scheduling_decision: null,
      logical_date: new Date().toISOString(),
      note: null,
      run_type: "manual",
      start_date: new Date().toISOString(),
      state: "queued",
    };
    setRuns((prev) => [newRun, ...prev]);
    return newRun;
  }, [dagId]);

  return { runs, loading, error, triggerRun };
}

export function useTaskInstances(dagId: string, runId: string) {
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const key = `${dagId}:${runId}`;
        setTasks(mockTaskInstances[key] || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch task instances");
      } finally {
        setLoading(false);
      }
    };

    if (dagId && runId) {
      fetchTasks();
    }
  }, [dagId, runId]);

  const clearTask = useCallback(async (taskId: string) => {
    // In production, this would call POST /api/v1/dags/{dag_id}/clearTaskInstances
    setTasks((prev) =>
      prev.map((task) =>
        task.task_id === taskId ? { ...task, state: "queued" } : task
      )
    );
  }, []);

  const markSuccess = useCallback(async (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.task_id === taskId ? { ...task, state: "success" } : task
      )
    );
  }, []);

  const markFailed = useCallback(async (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.task_id === taskId ? { ...task, state: "failed" } : task
      )
    );
  }, []);

  return { tasks, loading, error, clearTask, markSuccess, markFailed };
}

export function useTaskLogs(taskId: string) {
  const [logs, setLogs] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setLogs(mockTaskLogs[taskId] || "No logs available for this task.");
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch logs");
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchLogs();
    }
  }, [taskId]);

  return { logs, loading, error };
}
