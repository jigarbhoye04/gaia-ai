"use client";

import { formatDistanceToNow } from "date-fns";
import { Bell, Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/shadcn/popover";
import { ScrollArea } from "@/components/ui/shadcn/scroll-area";
import { useNotifications } from "@/features/notification/hooks/useNotifications";
import { useConfirmation } from "@/hooks/useConfirmation";

import {
  NotificationAction,
  NotificationRecord,
  NotificationStatus,
} from "../../types/features/notificationTypes";

interface NotificationCenterProps {
  className?: string;
}

const NotificationItem = ({
  notification,
  onMarkAsRead,
}: {
  notification: NotificationRecord;
  onMarkAsRead: (id: string) => void;
}) => {
  const { confirm, confirmationProps } = useConfirmation();
  const [executingActionId, setExecutingActionId] = useState<string | null>(
    null,
  );

  // Access content directly from notification
  const content = notification.content || {
    title: "Notification",
    body: "No details available",
    actions: [],
  };

  const isUnread = notification.status === NotificationStatus.DELIVERED;

  // const handleSnoozeClick = () => {
  //   const snoozeTime = new Date();
  //   snoozeTime.setHours(snoozeTime.getHours() + 1); // Snooze for 1 hour
  //   onSnooze(notification.id, snoozeTime);
  // };

  return (
    <div
      className={`p-4 transition-all duration-200 hover:bg-zinc-800/10 ${isUnread ? "border-l-2 border-l-zinc-800 bg-zinc-800/5" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="truncate text-sm font-medium text-zinc-900">
              {content.title}
            </h4>
            {isUnread && (
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
            )}
          </div>
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-zinc-700">
            {content.body}
          </p>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
              })}
            </span>
            <span>•</span>
            <span className="rounded-full bg-zinc-800/10 px-2 py-0.5 text-xs text-zinc-700">
              {notification.metadata?.reminder_id ? "reminder" : "system"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMarkAsRead(notification.id)}
            className="h-7 w-7 p-0 text-zinc-500 hover:bg-zinc-800/10 hover:text-zinc-800"
            title="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Actions buttons if present */}
      {content.actions &&
        Array.isArray(content.actions) &&
        content.actions.length > 0 && (
          <div className="mt-3 flex gap-2">
            {content.actions.map((action: NotificationAction) => {
              const isExecuted = action.executed || false;
              const isCurrentlyExecuting = executingActionId === action.id;
              const isDisabled =
                action.disabled || isExecuted || isCurrentlyExecuting;

              return (
                <Button
                  key={action.id}
                  variant={action.style === "primary" ? "default" : "outline"}
                  size="sm"
                  className={`h-7 border-zinc-800/20 bg-zinc-800/5 text-xs text-zinc-800 hover:border-zinc-800/30 hover:bg-zinc-800/10 ${
                    isExecuted ? "cursor-not-allowed opacity-50" : ""
                  }`}
                  disabled={isDisabled}
                  onClick={async () => {
                    if (isDisabled) return;

                    try {
                      if (
                        action.requires_confirmation &&
                        action.confirmation_message
                      ) {
                        const confirmed = await confirm({
                          title: "Confirm Action",
                          message: action.confirmation_message,
                          confirmText: "Continue",
                          cancelText: "Cancel",
                          variant:
                            action.style === "danger"
                              ? "destructive"
                              : "default",
                        });
                        if (!confirmed) return;
                      }

                      setExecutingActionId(action.id);

                      const { NotificationsAPI } = await import(
                        "@/services/api/notifications"
                      );
                      const result = await NotificationsAPI.executeAction(
                        notification.id,
                        action.id,
                      );

                      if (result.success) {
                        toast.success(
                          result.message || "Action executed successfully",
                        );
                        // Optionally trigger a refresh here if needed
                      } else {
                        toast.error(
                          result.message || "Failed to execute action",
                        );
                      }
                    } catch (error) {
                      console.error("Action execution failed:", error);
                      toast.error("Failed to execute action");
                    } finally {
                      setExecutingActionId(null);
                    }
                  }}
                >
                  {isCurrentlyExecuting ? (
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      {action.label}
                      {isExecuted && <span className="ml-1">✓</span>}
                    </>
                  )}
                </Button>
              );
            })}
          </div>
        )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog {...confirmationProps} />
    </div>
  );
};

export function NotificationCenter({
  className = "",
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("unread");

  const notificationOptions = useMemo(
    () => ({
      status: activeTab === "unread" ? NotificationStatus.DELIVERED : undefined,
      limit: 50,
    }),
    [activeTab],
  );

  const { notifications, loading, markAsRead, bulkMarkAsRead, refetch } =
    useNotifications(notificationOptions);

  const unreadCount = notifications.filter(
    (n) => n.status === NotificationStatus.DELIVERED,
  ).length;

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  // const handleArchive = async (notificationId: string) => {
  //   await archiveNotification(notificationId);
  // };

  // const handleSnooze = async (notificationId: string, until: Date) => {
  //   await snoozeNotification(notificationId, until);
  // };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications
      .filter((n) => n.status === NotificationStatus.DELIVERED)
      .map((n) => n.id);

    if (unreadIds.length > 0) {
      await bulkMarkAsRead(unreadIds);
    }
  };

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => n.status === NotificationStatus.DELIVERED)
      : notifications;

  return (
    <div className={`relative ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="group relative h-9 w-9 rounded-lg transition-all duration-200 hover:bg-zinc-100/50"
            aria-label="Notifications"
          >
            <Bell className="min-h-[18px] min-w-[18px] text-zinc-500 transition-all group-hover:text-zinc-700" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 p-0 text-xs text-white"
              >
                {unreadCount > 99 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="mr-4 w-96 border-zinc-800/20 bg-white p-0 shadow-xl shadow-zinc-900/5"
          align="end"
          sideOffset={8}
        >
          <div className="flex items-center justify-between border-b border-zinc-800/10 bg-zinc-900/5 p-4">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-zinc-500 hover:bg-zinc-800/10 hover:text-zinc-800"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-800/20">
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === "unread"
                  ? "border-b-2 border-zinc-800 bg-zinc-800/5 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-800/5 hover:text-zinc-800"
              }`}
              onClick={() => setActiveTab("unread")}
            >
              Unread ({unreadCount})
            </button>
            <button
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === "all"
                  ? "border-b-2 border-zinc-800 bg-zinc-800/5 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-800/5 hover:text-zinc-800"
              }`}
              onClick={() => setActiveTab("all")}
            >
              All ({notifications.length})
            </button>
          </div>

          {/* Actions bar */}
          {unreadCount > 0 && (
            <div className="border-b border-zinc-800/20 bg-zinc-900/5 p-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-7 border-zinc-800/20 bg-white text-xs text-zinc-800 hover:border-zinc-800/30 hover:bg-zinc-800/5"
              >
                Mark all as read
              </Button>
            </div>
          )}

          {/* Notifications list */}
          <ScrollArea className="h-96">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-800/20 border-t-zinc-800" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Bell className="mb-4 h-10 w-10 text-zinc-800/30" />
                <p className="font-medium text-zinc-700">
                  {activeTab === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {activeTab === "unread"
                    ? "All caught up!"
                    : "Notifications will appear here when you receive them"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/10">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-zinc-800/20 bg-zinc-900/5 p-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm text-zinc-600 hover:bg-zinc-800/5 hover:text-zinc-900"
              onClick={() => {
                setIsOpen(false);
                // Navigate to full notifications page using Next.js router
                window.location.href = "/notifications";
              }}
            >
              View all notifications
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
