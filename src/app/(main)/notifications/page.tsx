"use client";
import { Card, CardBody } from "@heroui/card";
import { Tab, Tabs } from "@heroui/tabs";
import { format, isPast, isToday, isYesterday } from "date-fns";
import { AlertCircle, Bell, CheckCircle, Clock, X } from "lucide-react";
import React from "react";

type NotificationType = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  source: string;
  icon: React.ReactNode;
};

type ReminderType = {
  id: string;
  title: string;
  message: string;
  dueDate: string;
  completed: boolean;
};

export default function NotificationsPage() {
  const notifications: NotificationType[] = [
    {
      id: "1",
      title: "IconScout",
      message: "Explore IconScout's AI-Powered Tools 🤖",
      time: "12h ago",
      read: false,
      source: "IconScout",
      icon: "🎨",
    },
  ];

  const reminders: ReminderType[] = [
    {
      id: "1",
      title: "Team Meeting",
      message: "Weekly progress review with development team",
      dueDate: "2025-03-08 15:00:00",
      completed: true,
    },
    {
      id: "4",
      title: "Pay Subscription",
      message: "Renew software license subscription",
      dueDate: "2025-03-15 23:59:00",
      completed: false,
    },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-[#0a1621] text-white">
      <header className="border-b border-[#1e2a35] p-4">
        <h1 className="text-2xl font-semibold">Notifications</h1>
      </header>

      <Tabs
        aria-label="Notification categories"
        className="px-4 pt-2"
        classNames={{
          tabList: "gap-2 w-full bg-[#0a1621] border-b border-[#1e2a35]",
          cursor: "bg-[#1a91da]",
          tab: "px-4 py-2 text-[#8b9aa8] data-[selected=true]:text-white",
          tabContent: "py-4",
        }}
      >
        <Tab
          key="notifications"
          title={
            <div className="flex items-center gap-2">
              <Bell size={18} />
              <span>Notifications</span>
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#1a91da] text-xs">
                {notifications.filter((n) => !n.read).length}
              </span>
            </div>
          }
        >
          <Card className="border-none bg-transparent shadow-none">
            <CardBody className="space-y-3 p-0">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex cursor-pointer items-start gap-4 rounded-lg p-4 ${
                    notification.read ? "bg-[#060f16]" : "bg-[#0c1927]"
                  } transition-colors hover:bg-[#122334]`}
                >
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                      notification.read ? "bg-[#1e2a35]" : "bg-[#1a91da]"
                    }`}
                  >
                    <span className="text-lg">{notification.icon}</span>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium">{notification.title}</h3>
                      <span className="text-xs text-[#8b9aa8]">
                        {notification.time}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#8b9aa8]">
                      {notification.message}
                    </p>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </Tab>

        <Tab
          key="reminders"
          title={
            <div className="flex items-center gap-2">
              <Clock size={18} />
              <span>Reminders</span>
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#1e8e3e] text-xs">
                {reminders.filter((r) => !r.completed).length}
              </span>
            </div>
          }
        >
          <Card className="border-none bg-transparent shadow-none">
            <CardBody className="space-y-3 p-0">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`rounded-lg p-4 ${
                    reminder.completed
                      ? "bg-[#060f16] opacity-75"
                      : "bg-[#0c1927]"
                  } transition-colors hover:bg-[#122334]`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1a91da]">
                      <Clock size={20} />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-start justify-between">
                        <h3
                          className={`font-medium ${
                            reminder.completed
                              ? "text-[#8b9aa8] line-through"
                              : ""
                          }`}
                        >
                          {reminder.title}
                        </h3>
                        <div className="flex gap-2">
                          {!reminder.completed && (
                            <button className="rounded-full bg-[#1e8e3e] p-1">
                              <CheckCircle size={16} />
                            </button>
                          )}
                          <button className="rounded-full bg-[#1e2a35] p-1">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-[#8b9aa8]">
                        {reminder.message}
                      </p>
                      <div className="mt-2 flex items-center text-xs">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            isPast(new Date(reminder.dueDate)) &&
                            !reminder.completed
                              ? "text-[#ea4335]"
                              : "text-[#8b9aa8]"
                          }`}
                        >
                          {isPast(new Date(reminder.dueDate)) &&
                          !reminder.completed ? (
                            <AlertCircle size={12} />
                          ) : (
                            <Clock size={12} />
                          )}
                          {formatDueDate(reminder.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}

function formatDueDate(dueDate: string): string {
  const due = new Date(dueDate);
  if (isToday(due)) return "Today";
  if (isYesterday(due)) return "Yesterday";
  return format(due, "MMM d, hh:mm a");
}
