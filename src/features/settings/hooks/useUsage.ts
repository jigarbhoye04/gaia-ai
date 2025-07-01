"use client";

import { useQuery } from "@tanstack/react-query";

import { usageApi } from "../api/usageApi";

export const useUsageSummary = () => {
  return useQuery({
    queryKey: ["usageSummary"],
    queryFn: () => usageApi.getUsageSummary(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};
