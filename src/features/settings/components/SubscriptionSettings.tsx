"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/skeleton";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { pricingApi } from "@/features/pricing/api/pricingApi";
import { useUserSubscriptionStatus } from "@/features/pricing/hooks/usePricing";
import {
  convertToUSDCents,
  formatUSDFromCents,
} from "@/features/pricing/utils/currencyConverter";

export function SubscriptionSettings() {
  const {
    data: subscriptionStatus,
    isLoading,
    refetch,
  } = useUserSubscriptionStatus();
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.",
      )
    ) {
      return;
    }

    setIsCancelling(true);
    try {
      await pricingApi.cancelSubscription(true);
      toast.success("Subscription cancelled successfully.");
      refetch();
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      toast.error("Failed to cancel subscription. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUpgrade = () => {
    router.push("/pricing");
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <h3 className="text-lg font-semibold">Subscription</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-16 w-full" />
        </CardBody>
      </Card>
    );
  }

  // Free plan display
  if (!subscriptionStatus?.is_subscribed || !subscriptionStatus.current_plan) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-lg font-semibold">Subscription</h3>
          <Chip color="default" variant="flat" size="sm">
            Free Plan
          </Chip>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-default-600">Plan</span>
              <span className="font-medium">Free</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-default-600">Price</span>
              <span className="font-medium">$0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-default-600">Status</span>
              <span className="font-medium">Active</span>
            </div>
          </div>

          <Divider />

          <Button
            color="primary"
            size="lg"
            className="w-full"
            onPress={handleUpgrade}
          >
            Upgrade to Pro
          </Button>
        </CardBody>
      </Card>
    );
  }

  const plan = subscriptionStatus.current_plan;
  const subscription = subscriptionStatus.subscription;

  // Convert price to USD for display
  const priceInUSDCents = convertToUSDCents(plan.amount, plan.currency);
  const priceFormatted = formatUSDFromCents(priceInUSDCents);

  // Format dates
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "created":
        return "warning";
      case "cancelled":
      case "expired":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "created":
        return "Activating";
      case "active":
        return "Active";
      case "cancelled":
        return "Cancelled";
      case "expired":
        return "Expired";
      default:
        return status;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Subscription</h3>
        <Chip
          color={getStatusColor(subscription?.status || "unknown")}
          variant="flat"
          size="sm"
        >
          {getStatusText(subscription?.status || "unknown")}
        </Chip>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Plan Details */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-default-600">Plan</span>
            <span className="font-medium">{plan.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-default-600">Price</span>
            <span className="font-medium">
              {priceFormatted} / {plan.duration}
            </span>
          </div>
          {subscription?.current_end && (
            <div className="flex justify-between">
              <span className="text-sm text-default-600">Next billing</span>
              <span className="font-medium">
                {formatDate(subscription.current_end)}
              </span>
            </div>
          )}
          {subscriptionStatus.days_remaining !== undefined && (
            <div className="flex justify-between">
              <span className="text-sm text-default-600">Days remaining</span>
              <span className="font-medium">
                {subscriptionStatus.days_remaining}
              </span>
            </div>
          )}
        </div>

        <Divider />

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            color="primary"
            variant="flat"
            onPress={handleUpgrade}
            className="w-full"
          >
            View Plans
          </Button>

          {subscription?.status === "active" && (
            <Button
              color="danger"
              variant="light"
              onPress={handleCancelSubscription}
              isLoading={isCancelling}
              disabled={isCancelling}
              className="w-full"
            >
              Cancel Subscription
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
