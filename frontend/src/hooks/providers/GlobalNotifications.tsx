"use client";

import { useNotifications } from "@/features/notification/hooks/useNotifications";
import { useNotificationWebSocket } from "@/features/notification/hooks/useNotificationWebSocket";

const GlobalNotifications = () => {
  const { addNotification, updateNotification } = useNotifications({
    limit: 100,
  });

  useNotificationWebSocket({
    onNotification: addNotification,
    onUpdate: updateNotification,
  });

  return null;
};

export default GlobalNotifications;
