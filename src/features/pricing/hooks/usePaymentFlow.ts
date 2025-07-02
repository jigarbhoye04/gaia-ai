"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { type PaymentCallbackData, pricingApi } from "../api/pricingApi";
import { usePaymentErrorHandling } from "./usePaymentErrorHandling";

export interface PaymentFlowStates {
  isInitiating: boolean;
  isProcessing: boolean;
  isVerifying: boolean;
  isComplete: boolean;
  error: string | null;
  showSuccessModal: boolean;
}

export const usePaymentFlow = () => {
  const [states, setStates] = useState<PaymentFlowStates>({
    isInitiating: false,
    isProcessing: false,
    isVerifying: false,
    isComplete: false,
    error: null,
    showSuccessModal: false,
  });

  const queryClient = useQueryClient();
  const router = useRouter();
  const {
    handleError,
    showNetworkRetryToast,
    showSuccessRecoveryToast,
    canRetry,
    resetRetryCount,
  } = usePaymentErrorHandling();

  const updateState = (newState: Partial<PaymentFlowStates>) => {
    setStates((prev) => ({ ...prev, ...newState }));
  };

  const resetFlow = useCallback(() => {
    setStates({
      isInitiating: false,
      isProcessing: false,
      isVerifying: false,
      isComplete: false,
      error: null,
      showSuccessModal: false,
    });
    resetRetryCount();
  }, [resetRetryCount]);

  const handlePaymentSuccess = useCallback(
    async (response: PaymentCallbackData) => {
      updateState({ isProcessing: false, isVerifying: true });

      // Show immediate success feedback
      toast.success("🎉 Payment successful! Activating your subscription...", {
        duration: 3000,
      });

      try {
        // Optimistically update subscription status
        queryClient.setQueryData(["userSubscriptionStatus"], (old: unknown) => {
          if (old && typeof old === "object") {
            return {
              ...old,
              is_subscribed: true,
              subscription: {
                ...(old as { subscription?: object }).subscription,
                status: "active",
              },
            };
          }
          return old;
        });

        // Start verification process in background
        let verificationSuccessful = false;

        try {
          await pricingApi.verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_signature: response.razorpay_signature,
          });
          verificationSuccessful = true;
          showSuccessRecoveryToast();
        } catch (verificationError) {
          handleError(verificationError, "Payment verification");
          // Don't throw here - webhook will handle verification
        }

        // Start polling for real subscription status
        let attempts = 0;
        const maxAttempts = 8; // 40 seconds max

        const pollStatus = async (): Promise<void> => {
          try {
            const realStatus = await pricingApi.getUserSubscriptionStatus();

            // Update with real data
            queryClient.setQueryData(["userSubscriptionStatus"], realStatus);

            if (
              realStatus.is_subscribed &&
              realStatus.subscription?.status === "active"
            ) {
              updateState({
                isVerifying: false,
                isComplete: true,
                showSuccessModal: true,
              });

              // Show completion message
              toast.success(
                "🎉 Welcome to GAIA Pro! Your subscription is now active.",
                {
                  duration: 4000,
                },
              );

              return;
            }

            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(pollStatus, 5000);
            } else {
              // Polling timed out but don't show error - user might still be active
              updateState({
                isVerifying: false,
                isComplete: true,
                showSuccessModal: verificationSuccessful,
              });

              if (verificationSuccessful) {
                toast.success(
                  "Subscription activated! If you experience any issues, please contact support.",
                  {
                    duration: 5000,
                  },
                );
              } else {
                toast.warning(
                  "Subscription is being processed. You'll receive a confirmation email shortly.",
                  {
                    duration: 5000,
                  },
                );
                // Only auto-navigate if modal won't show
                setTimeout(() => {
                  router.push("/c");
                }, 2000);
              }
            }
          } catch (error) {
            handleError(error, "Subscription status polling");
            attempts++;

            if (attempts < maxAttempts && canRetry()) {
              showNetworkRetryToast();
              setTimeout(pollStatus, 5000);
            } else {
              // Final fallback
              updateState({ isVerifying: false, isComplete: true });
              toast.info(
                "Subscription is being processed. Please check your email for confirmation.",
                {
                  duration: 5000,
                },
              );
              setTimeout(() => {
                router.push("/c");
              }, 2000);
            }
          }
        };

        // Start polling after brief delay
        setTimeout(pollStatus, 2000);
      } catch (error) {
        const categorizedError = handleError(error, "Post-payment processing");
        updateState({
          isVerifying: false,
          error: categorizedError.message,
        });
      }
    },
    [
      queryClient,
      router,
      handleError,
      showSuccessRecoveryToast,
      showNetworkRetryToast,
      canRetry,
    ],
  );

  const handlePaymentError = useCallback(
    (error: Error) => {
      const categorizedError = handleError(error, "Payment processing");
      updateState({
        isInitiating: false,
        isProcessing: false,
        isVerifying: false,
        error: categorizedError.message,
      });
    },
    [handleError],
  );

  const handlePaymentDismiss = useCallback(() => {
    updateState({
      isInitiating: false,
      isProcessing: false,
    });

    toast.info("Payment cancelled", {
      duration: 3000,
    });
  }, []);

  const startProcessing = useCallback(() => {
    updateState({ isInitiating: false, isProcessing: true });
  }, []);

  const startInitiating = useCallback(() => {
    updateState({ isInitiating: true, error: null });
  }, []);

  const handleSuccessModalClose = useCallback(() => {
    updateState({ showSuccessModal: false });
  }, []);

  const handleSuccessModalNavigate = useCallback(() => {
    updateState({ showSuccessModal: false });
    router.push("/c");
  }, [router]);

  return {
    states,
    actions: {
      resetFlow,
      startInitiating,
      startProcessing,
      handlePaymentSuccess,
      handlePaymentError,
      handlePaymentDismiss,
      handleSuccessModalClose,
      handleSuccessModalNavigate,
    },
  };
};
