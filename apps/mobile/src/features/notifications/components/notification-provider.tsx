import type * as Notifications from "expo-notifications";
import { createContext, type ReactNode, useContext } from "react";
import { useNotifications } from "@/features/notifications";

interface NotificationContextValue {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: string | null;
  isRegistered: boolean;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const notificationData = useNotifications();

  return (
    <NotificationContext.Provider value={notificationData}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotificationContext must be used inside NotificationProvider",
    );
  return ctx;
}
