"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from "react";
import { Notification, NotificationSettings } from "@/types/airflow";

interface NotificationContextType {
  notifications: Notification[];
  settings: NotificationSettings[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  updateSettings: (settings: NotificationSettings) => void;
  getSettingsForDag: (dagId: string) => NotificationSettings | undefined;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Create initial notifications with static timestamps
const initialNotifications: Notification[] = [
  {
    id: "1",
    dag_id: "example_dag_1",
    type: "error",
    message: "DAG run failed: example_dag_1",
    timestamp: "2024-01-15T10:00:00.000Z",
    read: false,
  },
  {
    id: "2",
    dag_id: "example_dag_2",
    type: "success",
    message: "DAG run completed: example_dag_2",
    timestamp: "2024-01-15T09:00:00.000Z",
    read: true,
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [settings, setSettings] = useState<NotificationSettings[]>([]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: Math.random().toString(36).slice(2, 11),
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const updateSettings = useCallback((newSettings: NotificationSettings) => {
    setSettings((prev) => {
      const index = prev.findIndex((s) => s.dag_id === newSettings.dag_id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = newSettings;
        return updated;
      }
      return [...prev, newSettings];
    });
  }, []);

  const getSettingsForDag = useCallback(
    (dagId: string) => {
      return settings.find((s) => s.dag_id === dagId);
    },
    [settings]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        settings,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        updateSettings,
        getSettingsForDag,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
