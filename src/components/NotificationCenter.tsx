"use client";

import { useNotifications } from "@/contexts/NotificationContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "error":
        return "destructive" as const;
      case "success":
        return "success" as const;
      case "warning":
        return "warning" as const;
      default:
        return "default" as const;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="flex flex-col max-h-96">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={markAllAsRead}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                className={cn(
                  "w-full text-left p-4 hover:bg-accent transition-colors",
                  !notification.read && "bg-accent/50"
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex gap-3">
                  <div className="mt-0.5">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getBadgeVariant(notification.type)} className="text-xs">
                        {notification.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      DAG: {notification.dag_id}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
