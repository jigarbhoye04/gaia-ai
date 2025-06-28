"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { type PaymentCallbackData, pricingApi } from "../api/pricingApi";
import { usePaymentFlow } from "./usePaymentFlow";
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
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const { data: config } = usePaymentConfig();
  const { states, actions } = usePaymentFlow();

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

      actions.resetFlow();
      actions.startInitiating();

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
            actions.startProcessing();
            await actions.handlePaymentSuccess(response);
          },
          modal: {
            ondismiss: () => {
              actions.handlePaymentDismiss();
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        console.error("Error creating subscription:", error);
        actions.handlePaymentError(
          error instanceof Error
            ? error
            : new Error("Failed to initiate payment"),
        );
      }
    },
    [isScriptLoaded, config, actions],
  );

  return {
    isLoading: states.isInitiating || states.isProcessing,
    isScriptLoaded,
    createSubscriptionPayment,
    paymentStates: states,
    paymentActions: actions,
  };
};
