"use client";

import { Button } from "@heroui/button";
import { Tab, Tabs } from "@heroui/react";
import { Bell, BellRing } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { NotificationsList } from "@/components/Notifications/NotificationsList";
import { useAllNotifications } from "@/features/notification/hooks/useAllNotifications";
import { useNotifications } from "@/features/notification/hooks/useNotifications";
import { NotificationsAPI } from "@/services/api/notifications";
import { NotificationStatus } from "@/types/features/notificationTypes";

export default function NotificationsPage() {
  const [testLoading, setTestLoading] = useState<string | false>(false);

  // Get unread notifications
  const {
    notifications: unreadNotifications,
    loading: unreadLoading,
    refetch: refetchUnread,
  } = useNotifications({
    status: NotificationStatus.DELIVERED,
    limit: 100,
  });

  // Get all notifications data
  const {
    allNotifications,
    loading: allLoading,
    refetchAll,
  } = useAllNotifications({
    limit: 100,
  });

  const handleTestNotification = async (type: string = "all") => {
    setTestLoading(type);
    try {
      const response = await NotificationsAPI.createTestNotification(type);
      if (response.success) {
        toast.success(
          `✅ Test ${type} notification(s) created successfully! Check the notifications list below.`,
        );
        // Refresh notifications to see it in the list
        setTimeout(() => {
          refetchAll();
          refetchUnread();
        }, 1000);
      } else {
        toast.error("Failed to create test notification");
      }
    } catch (error) {
      console.error("Error creating test notification:", error);
      toast.error("Error creating test notification");
    } finally {
      setTestLoading(false);
    }
  };

  const testTypes = [
    { key: "all", label: "All Types", emoji: "🎯" },
    { key: "email", label: "Email Draft", emoji: "📧" },
    { key: "calendar", label: "Calendar", emoji: "📅" },
    { key: "reminder", label: "Reminder", emoji: "🔔" },
    { key: "info", label: "Info", emoji: "ℹ️" },
    { key: "warning", label: "Warning", emoji: "⚠️" },
    { key: "error", label: "Error", emoji: "❌" },
    { key: "success", label: "Success", emoji: "✅" },
  ];

  return (
    <div className="flex w-full flex-col items-center justify-center p-5">
      {/* Test Buttons */}
      <div className="mb-4 flex w-full max-w-4xl flex-wrap justify-end gap-2">
        {testTypes.map((testType) => (
          <Button
            key={testType.key}
            color={testType.key === "all" ? "primary" : "default"}
            size="sm"
            variant={testType.key === "all" ? "solid" : "bordered"}
            isLoading={testLoading === testType.key}
            isDisabled={testLoading !== false}
            onPress={() => handleTestNotification(testType.key)}
          >
            {testType.emoji} {testType.label}
          </Button>
        ))}
      </div>

      <Tabs
        aria-label="Notifications"
        color="primary"
        variant="underlined"
        className="flex w-full justify-center"
        classNames={{ base: "w-full", tabList: "w-full max-w-4xl px-0" }}
      >
        <Tab
          key="unread"
          className="w-full"
          title={
            <div className="flex items-center space-x-2">
              <BellRing className="h-4 w-4" />
              <span>Unread</span>
              {unreadNotifications.length != 0 && (
                <span className="my-2 aspect-square rounded-full bg-zinc-600 px-2 py-0.5 text-xs text-foreground">
                  {unreadNotifications.length}
                </span>
              )}
            </div>
          }
        >
          <NotificationsList
            notifications={unreadNotifications}
            loading={unreadLoading}
            emptyMessage="No unread notifications"
            emptyDescription="All caught up! You're up to date with everything."
            onRefresh={refetchUnread}
          />
        </Tab>
        <Tab
          className="w-full"
          key="all"
          title={
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>All</span>
            </div>
          }
        >
          <NotificationsList
            notifications={allNotifications}
            loading={allLoading}
            emptyMessage="No notifications yet"
            emptyDescription="Notifications will appear here when you receive them."
            onRefresh={refetchAll}
          />
        </Tab>
      </Tabs>
    </div>
  );
}
