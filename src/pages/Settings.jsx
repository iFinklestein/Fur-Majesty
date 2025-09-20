
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { exportAllDataAsCSV } from "../components/utils/exportData";
import {
  Settings,
  User as UserIcon,
  Clock,
  Bell,
  Download,
  Trash2,
  Database,
  History // Import History icon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DemoDataSeeder from "../components/demo/DemoDataSeeder";
import { appCopy } from "../components/utils/copy";
import { scheduleAutoPurge } from "../components/utils/taskPurge"; // Import purge function

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    timezone: "America/New_York",
    units: "imperial",
    notifications: true,
    theme: "light",
    taskHistoryRetentionDays: 7 // Add new field to state
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setFormData({
        full_name: userData.full_name || "",
        timezone: userData.timezone || "America/New_York",
        units: userData.units || "imperial",
        notifications: userData.notifications !== false,
        theme: userData.theme || "light",
        taskHistoryRetentionDays: userData.taskHistoryRetentionDays || 7
      });
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await User.updateMyUserData(formData);
      // Run purge after settings are saved
      scheduleAutoPurge(); 
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const result = await exportAllDataAsCSV();
      if (result.success) {
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      alert("❌ Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      alert("Account deletion feature coming soon!");
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid gap-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-orange-50 to-pink-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-8 h-8" />
            {appCopy.settings.title}
          </h1>
          <p className="text-gray-600 mt-1">{appCopy.settings.subtitle}</p>
        </div>

        {/* Demo Data Seeder (dev only) */}
        <DemoDataSeeder />

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                {appCopy.settings.profile}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {appCopy.settings.preferences}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="units">Units</Label>
                <Select
                  value={formData.units}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, units: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imperial">Imperial (lbs, oz, °F)</SelectItem>
                    <SelectItem value="metric">Metric (kg, g, °C)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={formData.theme}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, theme: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Task History Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Task History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="taskHistory">Auto-purge completed tasks after</Label>
                <Select
                  value={String(formData.taskHistoryRetentionDays)}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, taskHistoryRetentionDays: Number(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Never</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Only completed tasks are purged. Active or upcoming tasks are never removed.</p>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {appCopy.settings.notifications}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive reminders for vet visits, medications, and more</p>
                </div>
                <Switch
                  checked={formData.notifications}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notifications: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button 
            type="submit" 
            disabled={saving}
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>{appCopy.settings.dataManagement}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">{appCopy.settings.exportData}</h4>
                <p className="text-sm text-gray-600">Download all your pet data in CSV format</p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleExportData}
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <Database className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </div>

            <div className="border-t pt-4">
              <Alert variant="destructive">
                <Trash2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Danger Zone:</strong> Deleting your account will permanently remove all your pet data. This action cannot be undone.
                </AlertDescription>
              </Alert>
              <Button 
                variant="destructive" 
                className="mt-4"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {appCopy.settings.deleteAccount}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
