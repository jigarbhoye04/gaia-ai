"use client";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { Tick02Icon } from "@/components/shared/icons";
import { useUser } from "@/features/auth/hooks/useUser";

// Removed currency import - using USD only
import { useRazorpay } from "../hooks/useRazorpay";
import { PaymentStatusIndicator } from "./PaymentStatusIndicator";

interface PricingCardProps {
  title: string;
  type: "main" | "secondary";
  price: number; // Price in USD cents (already discounted if applicable)
  originalPrice?: number; // Original price before discount (for yearly plans)
  featurestitle: React.ReactNode;
  features?: string[];
  durationIsMonth: boolean;
  className?: string;
  planId?: string; // Add planId prop for backend integration
  isCurrentPlan?: boolean;
  hasActiveSubscription?: boolean;
}

export function PricingCard({
  title,
  type,
  price,
  originalPrice,
  featurestitle,
  features,
  durationIsMonth,
  className,
  planId,
  isCurrentPlan,
  hasActiveSubscription,
}: PricingCardProps) {
  // Use the price directly from backend (already discounted if applicable)
  const finalPrice = price;

  // Calculate discount info if original price is provided
  const discountPercentage =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  // Calculate free months for yearly plan (assuming monthly price is originalPrice/12)
  const freeMonths =
    originalPrice && !durationIsMonth && originalPrice > price
      ? Math.round((originalPrice - price) / (originalPrice / 12))
      : 0;

  // Always display in USD format - convert from smallest unit (cents)
  const formatUSDPrice = (amountInCents: number) => {
    if (amountInCents === 0) return { formatted: "$0", currency: "USD" };
    const dollars = amountInCents / 100;
    return {
      formatted: `$${dollars.toFixed(0)}`,
      currency: "USD",
    };
  };

  const finalPriceFormatted = formatUSDPrice(finalPrice);
  const originalPriceFormatted = originalPrice
    ? formatUSDPrice(originalPrice)
    : null;

  const { createSubscriptionPayment, isLoading, paymentStates } = useRazorpay();
  const user = useUser();
  const router = useRouter();

  const handleGetStarted = async () => {
    if (price === 0) {
      // Handle free plan - redirect to signup or dashboard
      if (user) router.push("/c");
      else router.push("/signup");
      return;
    }

    if (!user) {
      toast.error("Please sign in to subscribe to a plan");
      router.push("/login");
      return;
    }

    if (isCurrentPlan && hasActiveSubscription) {
      toast.info("This is your current active plan");
      return;
    }

    if (hasActiveSubscription && !isCurrentPlan) {
      toast.info(
        "Please cancel your current subscription before subscribing to a different plan",
      );
      return;
    }

    if (!planId) {
      toast.error("Plan not available. Please try again later.");
      return;
    }

    await createSubscriptionPayment(planId, {
      name: user.name,
      email: user.email,
    });
  };

  return (
    <div
      className={`relative w-full rounded-2xl ${className} ${
        type === "main"
          ? "bg-zinc-900 outline-2 outline-primary"
          : "bg-zinc-900"
      } ${
        isCurrentPlan && hasActiveSubscription
          ? "ring-2 ring-green-500 ring-offset-2 ring-offset-zinc-950"
          : ""
      }`}
    >
      <div className="flex h-full flex-col gap-4 p-[7%]">
        <div className="flex flex-row items-center justify-between border-none!">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{title}</span>
            {isCurrentPlan && hasActiveSubscription && (
              <Chip
                className="flex items-center gap-[2px] border-none! text-xs"
                color="success"
                variant="flat"
              >
                <span>Current Plan</span>
              </Chip>
            )}
          </div>
          {!durationIsMonth && discountPercentage > 0 && !isCurrentPlan && (
            <Chip
              className="flex items-center gap-[2px] border-none! text-sm"
              color="primary"
              variant="flat"
            >
              <span>Save {discountPercentage}%</span>
            </Chip>
          )}
        </div>

        <div className="m-0! flex flex-col gap-0 border-none!">
          <div className="flex items-baseline gap-2 border-none!">
            {originalPriceFormatted && !durationIsMonth && (
              <span className="text-3xl font-normal text-red-500 line-through">
                {originalPriceFormatted.formatted}
              </span>
            )}
            <span className="text-5xl">{finalPriceFormatted.formatted}</span>
            {finalPriceFormatted.currency && (
              <span className="text-2xl">{finalPriceFormatted.currency}</span>
            )}
          </div>

          <span className="text-opacity-70 min-h-5 text-sm font-normal text-white">
            {price > 0 && (durationIsMonth ? "/ per month" : "/ per year")}
          </span>

          {!durationIsMonth && freeMonths > 0 && (
            <span className="mt-1 text-sm font-normal text-green-400">
              Get {freeMonths} month{freeMonths > 1 ? "s" : ""} free!
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-1 flex-col gap-1">
          {featurestitle}

          {!!features &&
            features.map((feature: string, index: number) => (
              <div
                key={index}
                className="flex items-center gap-3 border-none! text-sm font-light"
              >
                <Tick02Icon
                  height="20"
                  width="20"
                  className="min-h-[20px] min-w-[20px]"
                />
                {feature}
              </div>
            ))}
        </div>

        <div className="space-y-3">
          {(paymentStates.isInitiating ||
            paymentStates.isProcessing ||
            paymentStates.isVerifying) && (
            <PaymentStatusIndicator states={paymentStates} />
          )}

          <Button
            className="w-full font-medium"
            color={
              isCurrentPlan && hasActiveSubscription ? "success" : "primary"
            }
            variant={type === "main" ? "shadow" : "flat"}
            onPress={handleGetStarted}
            isLoading={isLoading}
            disabled={
              isLoading ||
              paymentStates.isVerifying ||
              (isCurrentPlan && hasActiveSubscription)
            }
          >
            {paymentStates.isInitiating
              ? "Preparing..."
              : paymentStates.isProcessing
                ? "Processing..."
                : paymentStates.isVerifying
                  ? "Activating..."
                  : isCurrentPlan && hasActiveSubscription
                    ? "Active Plan"
                    : hasActiveSubscription && !isCurrentPlan
                      ? "Switch Plan"
                      : price === 0
                        ? "Get started"
                        : "Subscribe now"}
          </Button>
        </div>
      </div>
    </div>
  );
}
