"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { type PaymentCallbackData, pricingApi } from "../api/pricingApi";
import { usePaymentConfig } from "./usePricing";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, handler: () => void) => void;
    };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id?: string;
  subscription_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: PaymentCallbackData) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

export const useRazorpay = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const { data: config } = usePaymentConfig();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Load Razorpay script
  useEffect(() => {
    const loadScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          setIsScriptLoaded(true);
          resolve(true);
        };
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    if (window.Razorpay) {
      setIsScriptLoaded(true);
    } else {
      loadScript();
    }
  }, []);

  // Create subscription payment
  const createSubscriptionPayment = useCallback(
    async (
      planId: string,
      userInfo?: { name?: string; email?: string; contact?: string },
    ) => {
      if (!isScriptLoaded || !config) {
        toast.error("Payment system not ready. Please try again.");
        return;
      }

      setIsLoading(true);
      try {
        // Create subscription
        const subscription = await pricingApi.createSubscription({
          plan_id: planId,
          customer_notify: true,
        });

        const options: RazorpayOptions = {
          key: config.razorpay_key_id,
          subscription_id: subscription.razorpay_subscription_id,
          amount: 0,
          currency: config.currency,
          name: config.company_name,
          description: "GAIA Pro Subscription",
          prefill: userInfo,
          theme: {
            color: config.theme_color,
          },
          handler: async (response: PaymentCallbackData) => {
            try {
              await pricingApi.verifyPayment({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              });

              toast.success(
                "Payment successful! Your subscription is now active.",
              );

              // Invalidate and refetch subscription status
              await queryClient.invalidateQueries({
                queryKey: ["userSubscriptionStatus"],
              });

              // Navigate to dashboard instead of hard reload
              router.push("/c");
            } catch (error) {
              console.error("Payment verification failed:", error);
              toast.error(
                "Payment verification failed. Please contact support.",
              );
            }
          },
          modal: {
            ondismiss: () => {
              toast.info("Payment cancelled");
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        console.error("Error creating subscription:", error);
        toast.error("Failed to initiate payment. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [isScriptLoaded, config],
  );

  return {
    isLoading,
    isScriptLoaded,
    createSubscriptionPayment,
  };
};
