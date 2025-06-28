"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Progress } from "@heroui/progress";
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
      await pricingApi.cancelSubscription(true); // Cancel at cycle end
      toast.success(
        "Subscription cancelled successfully. You'll continue to have access until the end of your billing period.",
      );
      refetch();
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      toast.error(
        "Failed to cancel subscription. Please try again or contact support.",
      );
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
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardBody className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-20 w-full" />
        </CardBody>
      </Card>
    );
  }

  if (!subscriptionStatus?.is_subscribed || !subscriptionStatus.current_plan) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Subscription</h3>
            <p className="text-sm text-default-500">
              Manage your GAIA subscription
            </p>
          </div>
          <Chip color="default" variant="flat" size="sm">
            Free Plan
          </Chip>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Plan</span>
              <span className="text-lg font-semibold">Free</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-default-600">Price</span>
              <span className="font-medium">$0</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-default-600">Status</span>
              <span className="text-sm">Active</span>
            </div>
          </div>

          <Divider />

          <div className="space-y-3">
            <span className="text-sm font-medium">Free Plan Features</span>
            <ul className="space-y-1 text-sm text-default-600">
              <li>• Basic chat functionality</li>
              <li>• 20 file uploads per month</li>
              <li>• Limited calendar management</li>
              <li>• 3 deep research sessions</li>
              <li>• Basic support</li>
            </ul>
          </div>

          <Divider />

          <div className="space-y-4">
            <div className="rounded-lg bg-primary/10 p-4">
              <h4 className="mb-2 font-medium text-primary">Upgrade to Pro</h4>
              <p className="mb-3 text-sm text-default-600">
                Unlock unlimited features, advanced AI capabilities, and
                priority support.
              </p>
              <ul className="mb-4 space-y-1 text-sm text-default-600">
                <li>• Unlimited file uploads</li>
                <li>• Advanced calendar & email management</li>
                <li>• Unlimited deep research</li>
                <li>• AI-powered reminders</li>
                <li>• Priority support</li>
              </ul>
            </div>

            <Button
              color="primary"
              size="lg"
              className="w-full"
              onPress={handleUpgrade}
            >
              Activate Pro Subscription
            </Button>

            <div className="text-center text-xs text-default-500">
              <p>Starting from $20/month • Cancel anytime</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  const plan = subscriptionStatus.current_plan;
  const subscription = subscriptionStatus.subscription;

  // Convert price to USD for display
  const priceInUSDCents = convertToUSDCents(plan.amount, plan.currency);
  const priceFormatted = formatUSDFromCents(priceInUSDCents);

  const isYearly = plan.duration === "yearly";
  const monthlyEquivalent = isYearly
    ? Math.round(priceInUSDCents / 12)
    : priceInUSDCents;
  const monthlyFormatted = formatUSDFromCents(monthlyEquivalent);

  // Calculate billing period progress
  const daysRemaining = subscriptionStatus.days_remaining || 0;
  const totalDays = isYearly ? 365 : 30;
  const progressPercentage = Math.max(
    0,
    Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100),
  );

  // Format dates
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "created":
        return "warning";
      case "paused":
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
        return "ACTIVATING";
      case "active":
        return "ACTIVE";
      case "paused":
        return "PAUSED";
      case "cancelled":
        return "CANCELLED";
      case "expired":
        return "EXPIRED";
      default:
        return status.toUpperCase();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Subscription</h3>
          <p className="text-sm text-default-500">
            Manage your GAIA Pro subscription
          </p>
        </div>
        <Chip
          color={getStatusColor(subscription?.status || "unknown")}
          variant="flat"
          size="sm"
        >
          {getStatusText(subscription?.status || "unknown")}
        </Chip>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Show activation message for CREATED status */}
        {subscription?.status === "created" && (
          <div className="rounded-lg border border-warning/20 bg-warning/10 p-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-warning"></div>
              <h4 className="font-medium text-warning">
                Subscription Activating
              </h4>
            </div>
            <p className="mt-2 text-sm text-default-600">
              Your payment was successful! We're activating your subscription
              now. This usually takes 10-30 seconds.
            </p>
            <p className="mt-1 text-xs text-default-500">
              You can start using Pro features immediately. The status will
              update automatically.
            </p>
          </div>
        )}

        {/* Plan Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Plan</span>
            <span className="text-lg font-semibold">{plan.name}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-default-600">Price</span>
            <span className="font-medium">{priceFormatted}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-default-600">Billing</span>
            <span className="text-sm capitalize">{plan.duration}</span>
          </div>

          {isYearly && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-default-600">
                Monthly equivalent
              </span>
              <span className="text-sm text-success">
                {monthlyFormatted}/month
              </span>
            </div>
          )}
        </div>

        <Divider />

        {/* Billing Period Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Billing Period</span>
            <span className="text-sm text-default-600">
              {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
            </span>
          </div>

          <Progress
            value={progressPercentage}
            color="primary"
            size="sm"
            className="w-full"
          />

          <div className="flex items-center justify-between text-xs text-default-500">
            <span>Started: {formatDate(subscription?.current_start)}</span>
            <span>Renews: {formatDate(subscription?.current_end)}</span>
          </div>
        </div>

        <Divider />

        {/* Usage Stats */}
        <div className="space-y-3">
          <span className="text-sm font-medium">Usage Stats</span>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-default-600">Payments Made</span>
              <span className="font-medium">
                {subscription?.paid_count || 0}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-default-600">Total Cycles</span>
              <span className="font-medium">
                {subscription?.total_count || 0}
              </span>
            </div>
          </div>
        </div>

        <Divider />

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {subscriptionStatus.can_upgrade && (
            <Button color="primary" variant="flat" onPress={handleUpgrade}>
              Upgrade Plan
            </Button>
          )}

          {subscription?.status === "active" && (
            <Button
              color="danger"
              variant="light"
              onPress={handleCancelSubscription}
              isLoading={isCancelling}
              disabled={isCancelling}
            >
              Cancel Subscription
            </Button>
          )}

          <div className="mt-2 text-xs text-default-500">
            <p>• Subscription managed through Razorpay</p>
            <p>• Changes take effect at the next billing cycle</p>
            <p>
              • For support, contact us with your subscription ID:{" "}
              {subscription?.id}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
