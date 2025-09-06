
"use client";

import { useCallback, useEffect, useState } from "react";
import { usePolling, PollingConfig } from "@/hooks/usePolling";

export const useOnlinePolling = <T = Record<string, unknown>>(
  pollingFunction: () => Promise<T>,
  config: PollingConfig<T> = {},
) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // --- Online/Offline detection ---
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // --- Wrapped polling function (type-safe) ---
  const wrappedPollingFunction = useCallback(() => pollingFunction(), [pollingFunction]);

  const { startPolling, stopPolling, ...rest } = usePolling(wrappedPollingFunction, config);

  // --- Start/Stop polling and immediate fetch on online ---
  useEffect(() => {
    let mounted = true;

    const handleOnlineChange = async () => {
      if (!mounted) return;

      if (isOnline) {
        try {
          // Immediate fetch on coming online
          await wrappedPollingFunction();
          if (mounted) {
            startPolling();
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      } else {
        stopPolling("manual");
      }
    };

    handleOnlineChange();

    return () => {
      mounted = false;
      stopPolling("manual");
    };
  }, [isOnline]);

  return { isOnline, startPolling, stopPolling, ...rest };
};
