"use client";

import { Skeleton } from "@heroui/react";

import { usePlans } from "../hooks/usePricing";
import { PricingCard } from "./PricingCard";

export function PricingCards({ durationIsMonth = false }) {
  const { data: plans, isLoading, error } = usePlans(true);

  if (isLoading) {
    return (
      <div className="grid w-screen max-w-(--breakpoint-sm) grid-cols-2 gap-3">
        <Skeleton className="h-96 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !plans) {
    // Fallback to static plans if API fails
    return (
      <div className="grid w-screen max-w-(--breakpoint-sm) grid-cols-2 gap-3">
        <PricingCard
          durationIsMonth={durationIsMonth}
          features={[
            "Basic chat functionality",
            "20 file uploads per month",
            "Limited calendar management",
            "Limited email management",
            "Limited proactive events",
            "Basic (non-AI) reminders",
            "Limited image generation",
            "Limited memory",
            "Track up to 3 goals",
            "Unlimited web search",
            "3 deep research sessions",
            "Basic calendar integration",
            "Limited notes storage (100 notes)",
            "Basic support",
            "To-do list management",
          ]}
          featurestitle={
            <div className="mb-1 flex flex-col border-none!">
              <span>What's Included?</span>
            </div>
          }
          price={0}
          discountPercentage={0}
          title="Free Plan"
          type="secondary"
        />
        <PricingCard
          durationIsMonth={durationIsMonth}
          features={[
            "Everything in Basic",
            "Unlimited file uploads",
            "Unlimited calendar management",
            "Unlimited email management",
            "Unlimited proactive events",
            "AI-powered smart reminders",
            "Unlimited image generation",
            "Extended memory",
            "Unlimited goal tracking",
            "Unlimited deep research",
            "Advanced AI models",
            "Premium support",
            "Private Discord channels",
            "Priority access to new features",
            "To-do list management",
          ]}
          featurestitle={
            <div className="mb-1 flex flex-col border-none!">
              <span>What's Included?</span>
            </div>
          }
          price={20}
          discountPercentage={25}
          title="Pro"
          type="main"
        />
      </div>
    );
  }

  // Filter plans by duration
  const filteredPlans = plans.filter((plan) => {
    if (durationIsMonth) {
      return plan.duration === "monthly";
    }
    return plan.duration === "yearly";
  });

  // Sort plans: Free first, then by amount
  const sortedPlans = filteredPlans.sort((a, b) => {
    if (a.amount === 0) return -1;
    if (b.amount === 0) return 1;
    return a.amount - b.amount;
  });

  return (
    <div className="grid w-screen max-w-(--breakpoint-sm) grid-cols-2 gap-3">
      {sortedPlans.map((plan) => {
        const isPro = plan.name.toLowerCase().includes("pro");

        return (
          <PricingCard
            key={plan.id}
            planId={plan.id}
            durationIsMonth={durationIsMonth}
            features={plan.features}
            featurestitle={
              <div className="mb-1 flex flex-col border-none!">
                <span>What's Included?</span>
              </div>
            }
            price={plan.amount / 100} // Convert from cents to dollars
            discountPercentage={!durationIsMonth && isPro ? 25 : 0}
            title={plan.name}
            type={isPro ? "main" : "secondary"}
          />
        );
      })}
    </div>
  );
}
