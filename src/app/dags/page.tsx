"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useDAGs } from "@/hooks/useAirflow";
import { useNotifications } from "@/contexts/NotificationContext";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  BellOff,
  Search,
  RefreshCw,
  Play,
  Pause,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DAG } from "@/types/airflow";

export default function DAGsPage() {
  const { dags, loading, togglePause } = useDAGs();
  const { getSettingsForDag, updateSettings } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");

  // Get all unique tags from DAGs
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    dags.forEach((dag) => {
      dag.tags.forEach((tag) => tagSet.add(tag.name));
    });
    return Array.from(tagSet).sort();
  }, [dags]);

  // Filter DAGs based on search and tag filter
  const filteredDAGs = useMemo(() => {
    return dags.filter((dag) => {
      const matchesSearch =
        searchQuery === "" ||
        dag.dag_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dag.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag =
        tagFilter === "all" ||
        dag.tags.some((tag) => tag.name === tagFilter);

      return matchesSearch && matchesTag;
    });
  }, [dags, searchQuery, tagFilter]);

  const handleTogglePause = async (dag: DAG) => {
    await togglePause(dag.dag_id, !dag.is_paused);
  };

  const handleToggleNotification = (dagId: string) => {
    const currentSettings = getSettingsForDag(dagId);
    updateSettings({
      dag_id: dagId,
      enabled: !currentSettings?.enabled,
      on_success: true,
      on_failure: true,
      on_retry: false,
    });
  };

  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">DAGs</h1>
              <p className="text-muted-foreground">
                Manage and monitor your Airflow DAGs
              </p>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search DAGs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* DAGs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DAG ID</TableHead>
                  <TableHead className="hidden md:table-cell">Owner</TableHead>
                  <TableHead className="hidden lg:table-cell">Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-center">Notify</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-10 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredDAGs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No DAGs found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDAGs.map((dag) => {
                    const notificationEnabled = getSettingsForDag(dag.dag_id)?.enabled;
                    return (
                      <TableRow key={dag.dag_id}>
                        <TableCell>
                          <div className="space-y-1">
                            <Link
                              href={`/dags/${dag.dag_id}`}
                              className="font-medium hover:text-primary transition-colors"
                            >
                              {dag.dag_id}
                            </Link>
                            {dag.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {dag.tags.map((tag) => (
                                  <Badge
                                    key={tag.name}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {dag.owners.join(", ")}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {dag.timetable_description || dag.schedule_interval?.value || "None"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={dag.is_active ? "success" : "secondary"}
                          >
                            {dag.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {dag.is_paused ? (
                              <Pause className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Play className="h-4 w-4 text-green-500" />
                            )}
                            <Switch
                              checked={!dag.is_paused}
                              onCheckedChange={() => handleTogglePause(dag)}
                              aria-label={dag.is_paused ? "Resume DAG" : "Pause DAG"}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleNotification(dag.dag_id)}
                            aria-checked={notificationEnabled}
                            className={cn(
                              "transition-colors",
                              notificationEnabled && "text-primary"
                            )}
                          >
                            {notificationEnabled ? (
                              <Bell className="h-4 w-4" />
                            ) : (
                              <BellOff className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Link href={`/dags/${dag.dag_id}`}>
                            <Button variant="ghost" size="icon">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Stats */}
          {!loading && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredDAGs.length} of {dags.length} DAGs
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
