"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useDAG, useDAGRuns, useTaskInstances, useTaskLogs } from "@/hooks/useAirflow";
import { useNotifications } from "@/contexts/NotificationContext";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Play,
  Pause,
  RefreshCw,
  MoreVertical,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DAGRun, TaskInstance, TaskState } from "@/types/airflow";

interface PageProps {
  params: Promise<{ dagId: string }>;
}

function getTaskStateColor(state: TaskState): string {
  switch (state) {
    case "success":
      return "bg-green-500";
    case "running":
      return "bg-blue-500";
    case "failed":
      return "bg-red-500";
    case "upstream_failed":
      return "bg-orange-500";
    case "skipped":
      return "bg-gray-400";
    case "up_for_retry":
      return "bg-yellow-500";
    case "queued":
      return "bg-purple-500";
    case "scheduled":
      return "bg-cyan-500";
    default:
      return "bg-gray-300";
  }
}

function getRunStateBadgeVariant(state: string): "default" | "success" | "destructive" | "secondary" | "warning" {
  switch (state) {
    case "success":
      return "success";
    case "failed":
      return "destructive";
    case "running":
      return "default";
    case "queued":
      return "warning";
    default:
      return "secondary";
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString();
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "-";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs.toFixed(0)}s`;
}

// Log Viewer Component
function LogViewer({ dagId, runId, taskId, tryNumber }: { dagId: string; runId: string; taskId: string; tryNumber: number }) {
  const { logs, loading, error } = useTaskLogs(dagId, runId, taskId, tryNumber);

  // Simple log highlighting
  const highlightedLogs = logs.split('\n').map((line, index) => {
    let className = "text-sm font-mono";
    if (line.includes("ERROR") || line.includes("FAILED")) {
      className += " text-red-500";
    } else if (line.includes("WARNING")) {
      className += " text-yellow-500";
    } else if (line.includes("SUCCESS") || line.includes("Marking task as SUCCESS")) {
      className += " text-green-500";
    } else if (line.includes("INFO")) {
      className += " text-blue-500";
    }
    return (
      <div key={index} className={className}>
        {line}
      </div>
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-destructive">
        Error loading logs: {error}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-gray-100 p-4 rounded-md max-h-96 overflow-auto">
      {highlightedLogs}
    </div>
  );
}

// Task Row Component
function TaskRow({
  task,
  dagId,
  onClear,
  onMarkSuccess,
  onMarkFailed,
}: {
  task: TaskInstance;
  dagId: string;
  onClear: () => void;
  onMarkSuccess: () => void;
  onMarkFailed: () => void;
}) {
  const [logDialogOpen, setLogDialogOpen] = useState(false);

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full", getTaskStateColor(task.state))} />
          <span className="font-medium">{task.task_id}</span>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">{task.operator}</TableCell>
      <TableCell>
        <Badge variant={getRunStateBadgeVariant(task.state || "no_status")}>
          {task.state || "no_status"}
        </Badge>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {formatDuration(task.duration)}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {formatDate(task.start_date)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <FileText className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Task Logs: {task.task_id}</DialogTitle>
                <DialogDescription>
                  Try #{task.try_number} - {task.state}
                </DialogDescription>
              </DialogHeader>
              <LogViewer dagId={dagId} runId={task.dag_run_id} taskId={task.task_id} tryNumber={task.try_number} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setLogDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Task Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onClear}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMarkSuccess}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Success
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMarkFailed} className="text-destructive">
                <XCircle className="h-4 w-4 mr-2" />
                Mark Failed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

// Run Details Component
function RunDetails({ dagId, run }: { dagId: string; run: DAGRun }) {
  const { tasks, loading, clearTask, markSuccess, markFailed } = useTaskInstances(
    dagId,
    run.dag_run_id
  );

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No task instances for this run
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead className="hidden md:table-cell">Operator</TableHead>
          <TableHead>State</TableHead>
          <TableHead className="hidden lg:table-cell">Duration</TableHead>
          <TableHead className="hidden md:table-cell">Started</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TaskRow
            key={task.task_id}
            task={task}
            dagId={dagId}
            onClear={() => clearTask(task.task_id)}
            onMarkSuccess={() => markSuccess(task.task_id)}
            onMarkFailed={() => markFailed(task.task_id)}
          />
        ))}
      </TableBody>
    </Table>
  );
}

// Grid View Component (simplified task status grid)
function GridView({ runs }: { runs: DAGRun[] }) {
  const recentRuns = runs.slice(0, 10);
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
        {recentRuns.map((run) => (
          <div
            key={run.dag_run_id}
            className={cn(
              "aspect-square rounded-md flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity",
              run.state === "success" && "bg-green-500",
              run.state === "failed" && "bg-red-500",
              run.state === "running" && "bg-blue-500",
              run.state === "queued" && "bg-yellow-500"
            )}
            title={`${run.dag_run_id}: ${run.state}`}
          >
            {run.run_type === "manual" ? "M" : "S"}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" /> Success
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" /> Failed
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" /> Running
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500" /> Queued
        </div>
      </div>
    </div>
  );
}

export default function DAGDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const dagId = decodeURIComponent(resolvedParams.dagId);
  const { dag, loading: dagLoading, togglePause } = useDAG(dagId);
  const { runs, loading: runsLoading, triggerRun } = useDAGRuns(dagId);
  const { getSettingsForDag, updateSettings } = useNotifications();
  const [selectedRun, setSelectedRun] = useState<DAGRun | null>(null);
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);
  const [triggerConf, setTriggerConf] = useState("{}");
  const [triggering, setTriggering] = useState(false);

  const notificationEnabled = getSettingsForDag(dagId)?.enabled;

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const conf = JSON.parse(triggerConf);
      await triggerRun(conf);
      setTriggerDialogOpen(false);
      setTriggerConf("{}");
    } catch {
      // Invalid JSON, handle error
    } finally {
      setTriggering(false);
    }
  };

  const handleToggleNotification = () => {
    const currentSettings = getSettingsForDag(dagId);
    updateSettings({
      dag_id: dagId,
      enabled: !currentSettings?.enabled,
      on_success: true,
      on_failure: true,
      on_retry: false,
    });
  };

  // Calculate stats
  const successRuns = runs.filter((r) => r.state === "success").length;
  const failedRuns = runs.filter((r) => r.state === "failed").length;
  const runningRuns = runs.filter((r) => r.state === "running").length;
  const successRate = runs.length > 0 ? (successRuns / runs.length) * 100 : 0;

  if (dagLoading) {
    return (
      <AuthGuard>
        <AppShell>
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  if (!dag) {
    return (
      <AuthGuard>
        <AppShell>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">DAG Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The DAG &quot;{dagId}&quot; could not be found.
            </p>
            <Link href="/dags">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to DAGs
              </Button>
            </Link>
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <Link href="/dags">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold">{dag.dag_id}</h1>
                  <Badge variant={dag.is_active ? "success" : "secondary"}>
                    {dag.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {dag.description || "No description"}
                </p>
                {dag.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {dag.tags.map((tag) => (
                      <Badge key={tag.name} variant="outline">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border">
                {dag.is_paused ? (
                  <Pause className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Play className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm">
                  {dag.is_paused ? "Paused" : "Running"}
                </span>
                <Switch
                  checked={!dag.is_paused}
                  onCheckedChange={() => togglePause(!dag.is_paused)}
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleNotification}
                className={cn(notificationEnabled && "text-primary")}
              >
                {notificationEnabled ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
              </Button>

              <Dialog open={triggerDialogOpen} onOpenChange={setTriggerDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Play className="h-4 w-4 mr-2" />
                    Trigger DAG
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Trigger DAG Run</DialogTitle>
                    <DialogDescription>
                      Manually trigger a new DAG run with optional configuration.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Configuration (JSON)</label>
                      <Textarea
                        value={triggerConf}
                        onChange={(e) => setTriggerConf(e.target.value)}
                        placeholder="{}"
                        className="font-mono mt-2"
                        rows={6}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTriggerDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleTrigger} disabled={triggering}>
                      {triggering ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Trigger
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Link href={`/dags/${dagId}/settings`}>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Runs</CardDescription>
                <CardTitle className="text-3xl">{runs.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Success Rate</CardDescription>
                <CardTitle className="text-3xl text-green-500">
                  {successRate.toFixed(0)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={successRate} className="h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Failed</CardDescription>
                <CardTitle className="text-3xl text-red-500">{failedRuns}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Running</CardDescription>
                <CardTitle className="text-3xl text-blue-500">{runningRuns}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="grid" className="space-y-4">
            <TabsList>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="runs">DAG Runs</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="grid" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Runs</CardTitle>
                  <CardDescription>
                    Visual overview of recent DAG runs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {runsLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : runs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No runs yet
                    </div>
                  ) : (
                    <GridView runs={runs} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="runs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>DAG Runs</CardTitle>
                  <CardDescription>
                    History of all DAG runs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {runsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : runs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No runs yet
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Run ID</TableHead>
                          <TableHead>State</TableHead>
                          <TableHead className="hidden md:table-cell">Type</TableHead>
                          <TableHead className="hidden lg:table-cell">Started</TableHead>
                          <TableHead className="hidden lg:table-cell">Ended</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {runs.map((run) => (
                          <TableRow key={run.dag_run_id}>
                            <TableCell className="font-medium">
                              <span className="truncate max-w-xs block">
                                {run.dag_run_id}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getRunStateBadgeVariant(run.state)}>
                                {run.state === "running" && (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                )}
                                {run.state}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline">{run.run_type}</Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm">
                              {formatDate(run.start_date)}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm">
                              {formatDate(run.end_date)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedRun(run)}
                              >
                                View Tasks
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Selected Run Details */}
              {selectedRun && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Tasks: {selectedRun.dag_run_id}</CardTitle>
                        <CardDescription>
                          Task instances for this run
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRun(null)}
                      >
                        Close
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <RunDetails dagId={dagId} run={selectedRun} />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>DAG Information</CardTitle>
                  <CardDescription>
                    Details about this DAG
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Schedule
                      </dt>
                      <dd className="mt-1">
                        {dag.timetable_description || dag.schedule_interval?.value || "None"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Owners
                      </dt>
                      <dd className="mt-1">{dag.owners.join(", ")}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Max Active Runs
                      </dt>
                      <dd className="mt-1">{dag.max_active_runs}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Max Active Tasks
                      </dt>
                      <dd className="mt-1">{dag.max_active_tasks}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Next Run
                      </dt>
                      <dd className="mt-1">
                        {dag.next_dagrun ? formatDate(dag.next_dagrun) : "Not scheduled"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Last Parsed
                      </dt>
                      <dd className="mt-1">{formatDate(dag.last_parsed_time)}</dd>
                    </div>
                    <div className="md:col-span-2">
                      <dt className="text-sm font-medium text-muted-foreground">
                        File Location
                      </dt>
                      <dd className="mt-1 font-mono text-sm">{dag.fileloc}</dd>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
