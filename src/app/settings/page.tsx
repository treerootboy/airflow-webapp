"use client";

import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Bell, Save } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [airflowUrl, setAirflowUrl] = useState("http://localhost:8080");

  const handleSave = () => {
    // In production, this would save to backend/localStorage
    alert("Settings saved successfully!");
  };

  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-6 max-w-2xl">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Configure your Airflow Manager preferences
            </p>
          </div>

          {/* Connection Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Connection</CardTitle>
              <CardDescription>
                Configure your Airflow server connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="airflow-url">Airflow API URL</Label>
                <Input
                  id="airflow-url"
                  value={airflowUrl}
                  onChange={(e) => setAirflowUrl(e.target.value)}
                  placeholder="http://localhost:8080"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications for DAG events
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={pushEnabled}
                  onCheckedChange={setPushEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email alerts for failures
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use dark theme
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
            </CardContent>
          </Card>

          {/* PWA Installation */}
          <Card>
            <CardHeader>
              <CardTitle>Install App</CardTitle>
              <CardDescription>
                Install this application on your device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Add Airflow Manager to your home screen for quick access and offline support.
              </p>
              <Button variant="outline">
                Install PWA
              </Button>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
