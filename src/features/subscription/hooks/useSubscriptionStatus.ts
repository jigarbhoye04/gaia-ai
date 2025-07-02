import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useUserSubscriptionStatus } from "@/features/pricing/hooks/usePricing";

export function useSubscriptionActivationStatus() {
  const { data: subscriptionStatus, refetch } = useUserSubscriptionStatus();
  const [isPolling, setIsPolling] = useState(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);

  useEffect(() => {
    const currentStatus = subscriptionStatus?.subscription?.status;

    // Check if subscription just became active
    if (lastStatus && lastStatus !== "active" && currentStatus === "active") {
      toast.success("🎉 Your subscription is now active! Enjoy GAIA Pro!");
    }

    setLastStatus(currentStatus || null);
  }, [subscriptionStatus?.subscription?.status, lastStatus]);

  const startPolling = () => {
    if (isPolling) return;

    setIsPolling(true);
    let attempts = 0;
    const maxAttempts = 12; // 1 minute of polling

    const poll = async () => {
      try {
        await refetch();
        attempts++;

        if (
          subscriptionStatus?.is_subscribed &&
          subscriptionStatus?.subscription?.status === "active"
        ) {
          setIsPolling(false);
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setIsPolling(false);
        }
      } catch (error) {
        console.error("Error polling subscription:", error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          setIsPolling(false);
        }
      }
    };

    poll();
  };

  return {
    isPolling,
    startPolling,
    subscriptionStatus,
  };
}
