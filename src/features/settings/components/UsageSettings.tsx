"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Tab, Tabs } from "@heroui/tabs";
import { BarChart3, Calendar, Crown, TrendingUp } from "lucide-react";
import { useState } from "react";

import Spinner from "@/components/ui/shadcn/spinner";

import { useUsageSummary } from "../hooks/useUsage";

export default function UsageSettings() {
  const [selectedPeriod, setSelectedPeriod] = useState("day");
  const { data: summary, isLoading: summaryLoading } = useUsageSummary();

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "danger";
    if (percentage >= 70) return "warning";
    return "success";
  };

  if (summaryLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Get features for the selected period
  const featuresWithPeriod = summary
    ? Object.entries(summary.features).filter(
        ([_, feature]) =>
          feature.periods[selectedPeriod as keyof typeof feature.periods],
      )
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Upgrade to Pro Header */}
      {summary?.plan_type !== "pro" && (
        <div className="rounded-lg border border-[#00bbff]/30 bg-gradient-to-r from-[#00bbff]/10 to-[#00bbff]/20 p-4 dark:border-[#00bbff]/50 dark:from-[#00bbff]/20 dark:to-[#00bbff]/30">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Crown className="mt-0.5 h-5 w-5 text-[#00bbff] dark:text-[#00bbff]" />
            </div>
            <div className="flex-1">
              <h3 className="mb-1 text-base font-semibold text-[#00bbff] dark:text-[#00bbff]">
                Upgrade to Pro for unlimited access
              </h3>
              <p className="mb-3 text-sm text-[#00bbff]/80 dark:text-[#00bbff]/90">
                Get unlimited usage across all features, priority support, and
                exclusive Pro features.
              </p>
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#00bbff] to-[#0099cc] font-medium text-white shadow-lg hover:from-[#0099cc] hover:to-[#0077aa]"
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Period Selection */}
      <div className="flex items-center justify-between">
        <div className="flex w-full items-center justify-between">
          <div>
            <h1 className="text-xl font-medium tracking-tight">Usage</h1>
            <p className="text-sm text-foreground-500">
              Monitor your feature usage and limits
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Chip
              size="sm"
              color={summary?.plan_type === "pro" ? "warning" : "default"}
              startContent={
                summary?.plan_type === "pro" ? <Crown size={14} /> : null
              }
              className="font-medium"
            >
              {summary?.plan_type?.toUpperCase() || "FREE"} PLAN
            </Chip>
            <Tabs
              selectedKey={selectedPeriod}
              onSelectionChange={(key) => setSelectedPeriod(key as string)}
            >
              <Tab
                key="day"
                title={
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>Daily</span>
                  </div>
                }
              />
              <Tab
                key="month"
                title={
                  <div className="flex items-center space-x-2">
                    <TrendingUp size={16} />
                    <span>Monthly</span>
                  </div>
                }
              />
            </Tabs>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="space-y-3">
        {featuresWithPeriod.length === 0 ? (
          <Card>
            <CardBody className="py-8 text-center">
              <BarChart3 className="text-muted-foreground/50 mx-auto h-10 w-10" />
              <h3 className="mt-3 text-base font-medium">
                No limits configured
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                No {selectedPeriod}ly limits are configured for your{" "}
                {summary?.plan_type?.toUpperCase()} plan.
              </p>
            </CardBody>
          </Card>
        ) : (
          featuresWithPeriod.map(([key, feature]) => {
            const periodData =
              feature.periods[selectedPeriod as keyof typeof feature.periods];
            if (!periodData) return null;

            return (
              <Card key={key} className="border-none shadow-none">
                <CardBody className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-normal">
                            {feature.title}
                          </h4>
                          <div className="text-xs font-light text-foreground-400">
                            {feature.description}
                          </div>
                        </div>
                        <Chip
                          className="flex items-center space-x-3 text-foreground-600"
                          size="sm"
                        >
                          {periodData.used.toLocaleString()} /{" "}
                          {periodData.limit.toLocaleString()}
                        </Chip>
                      </div>

                      <Progress
                        value={periodData.percentage}
                        color={getProgressColor(periodData.percentage)}
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
