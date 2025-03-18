"use client";
import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Tab, Tabs } from "@heroui/tabs";
import { Bell, Clock, CheckCircle, X, AlertCircle } from "lucide-react";
import { isPast, isToday, isYesterday, format } from "date-fns";

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
    <div className="flex w-full flex-col h-full bg-[#0a1621] text-white">
      <header className="p-4 border-b border-[#1e2a35]">
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
              <span className="ml-1 bg-[#1a91da] text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.filter((n) => !n.read).length}
              </span>
            </div>
          }
        >
          <Card className="bg-transparent border-none shadow-none">
            <CardBody className="p-0 space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg flex items-start gap-4 cursor-pointer ${
                    notification.read ? "bg-[#060f16]" : "bg-[#0c1927]"
                  } hover:bg-[#122334] transition-colors`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.read ? "bg-[#1e2a35]" : "bg-[#1a91da]"
                    }`}
                  >
                    <span className="text-lg">{notification.icon}</span>
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{notification.title}</h3>
                      <span className="text-xs text-[#8b9aa8]">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-sm text-[#8b9aa8] mt-1">
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
              <span className="ml-1 bg-[#1e8e3e] text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {reminders.filter((r) => !r.completed).length}
              </span>
            </div>
          }
        >
          <Card className="bg-transparent border-none shadow-none">
            <CardBody className="p-0 space-y-3">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`p-4 rounded-lg ${
                    reminder.completed
                      ? "bg-[#060f16] opacity-75"
                      : "bg-[#0c1927]"
                  } hover:bg-[#122334] transition-colors`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#1a91da] flex items-center justify-center flex-shrink-0">
                      <Clock size={20} />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h3
                          className={`font-medium ${
                            reminder.completed
                              ? "line-through text-[#8b9aa8]"
                              : ""
                          }`}
                        >
                          {reminder.title}
                        </h3>
                        <div className="flex gap-2">
                          {!reminder.completed && (
                            <button className="bg-[#1e8e3e] p-1 rounded-full">
                              <CheckCircle size={16} />
                            </button>
                          )}
                          <button className="bg-[#1e2a35] p-1 rounded-full">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-[#8b9aa8] mt-1">
                        {reminder.message}
                      </p>
                      <div className="flex items-center mt-2 text-xs">
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
