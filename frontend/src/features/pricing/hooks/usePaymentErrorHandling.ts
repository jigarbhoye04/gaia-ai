"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

interface PaymentError {
  type:
    | "NETWORK_ERROR"
    | "VERIFICATION_ERROR"
    | "TIMEOUT_ERROR"
    | "SUBSCRIPTION_ERROR"
    | "UNKNOWN_ERROR";
  message: string;
  retryable: boolean;
  details?: string;
}

export const usePaymentErrorHandling = () => {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const categorizeError = useCallback((error: unknown): PaymentError => {
    if (error && typeof error === "object" && "message" in error) {
      const errorMessage = (error as Error).message.toLowerCase();

      if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        return {
          type: "NETWORK_ERROR",
          message:
            "Network connection issue. Please check your internet and try again.",
          retryable: true,
          details: (error as Error).message,
        };
      }

      if (
        errorMessage.includes("verification") ||
        errorMessage.includes("signature")
      ) {
        return {
          type: "VERIFICATION_ERROR",
          message:
            "Payment verification failed. Your payment may still be processing.",
          retryable: false,
          details: (error as Error).message,
        };
      }

      if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("timed out")
      ) {
        return {
          type: "TIMEOUT_ERROR",
          message: "Request timed out. Please try again.",
          retryable: true,
          details: (error as Error).message,
        };
      }

      if (errorMessage.includes("subscription")) {
        return {
          type: "SUBSCRIPTION_ERROR",
          message:
            "Subscription setup failed. Please contact support if this persists.",
          retryable: true,
          details: (error as Error).message,
        };
      }
    }

    return {
      type: "UNKNOWN_ERROR",
      message: "An unexpected error occurred. Please try again.",
      retryable: true,
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }, []);

  const handleError = useCallback(
    (error: unknown, context: string) => {
      const categorizedError = categorizeError(error);
      console.error(`Payment error in ${context}:`, {
        type: categorizedError.type,
        message: categorizedError.message,
        details: categorizedError.details,
        retryCount,
      });

      // Show appropriate toast based on error type
      switch (categorizedError.type) {
        case "NETWORK_ERROR":
          toast.error(categorizedError.message, {
            duration: 5000,
            action:
              categorizedError.retryable && retryCount < maxRetries
                ? {
                    label: "Retry",
                    onClick: () => {
                      setRetryCount((prev) => prev + 1);
                      // The retry logic should be handled by the calling component
                    },
                  }
                : undefined,
          });
          break;

        case "VERIFICATION_ERROR":
          toast.warning(categorizedError.message, {
            duration: 7000,
            description:
              "Check your email for payment confirmation. Contact support if you don't receive it.",
          });
          break;

        case "TIMEOUT_ERROR":
          toast.error(categorizedError.message, {
            duration: 5000,
            action:
              categorizedError.retryable && retryCount < maxRetries
                ? {
                    label: "Retry",
                    onClick: () => setRetryCount((prev) => prev + 1),
                  }
                : undefined,
          });
          break;

        case "SUBSCRIPTION_ERROR":
          toast.error(categorizedError.message, {
            duration: 6000,
            description:
              "Our team has been notified. Try again or contact support.",
          });
          break;

        default:
          toast.error(categorizedError.message, {
            duration: 5000,
          });
      }

      return categorizedError;
    },
    [categorizeError, retryCount, maxRetries],
  );

  const showNetworkRetryToast = useCallback(() => {
    toast.error("Connection lost. Retrying...", {
      duration: 3000,
    });
  }, []);

  const showSuccessRecoveryToast = useCallback(() => {
    toast.success("Connection restored! Continuing...", {
      duration: 3000,
    });
  }, []);

  const resetRetryCount = useCallback(() => {
    setRetryCount(0);
  }, []);

  const canRetry = useCallback(() => {
    return retryCount < maxRetries;
  }, [retryCount, maxRetries]);

  return {
    handleError,
    showNetworkRetryToast,
    showSuccessRecoveryToast,
    resetRetryCount,
    canRetry,
    retryCount,
    maxRetries,
  };
};
