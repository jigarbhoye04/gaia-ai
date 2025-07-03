import { useQuery } from "@tanstack/react-query";

import { type Plan,pricingApi } from "../api/pricingApi";

export const usePlans = (activeOnly = true, initialData?: Plan[]) => {
  return useQuery({
    queryKey: ["plans", activeOnly],
    queryFn: () => pricingApi.getPlans(activeOnly),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...(initialData && { initialData }),
  });
};

export const usePlan = (planId: string) => {
  return useQuery({
    queryKey: ["plan", planId],
    queryFn: () => pricingApi.getPlan(planId),
    enabled: !!planId,
  });
};

export const usePaymentConfig = () => {
  return useQuery({
    queryKey: ["paymentConfig"],
    queryFn: () => pricingApi.getPaymentConfig(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUserSubscriptionStatus = () => {
  return useQuery({
    queryKey: ["userSubscriptionStatus"],
    queryFn: () => pricingApi.getUserSubscriptionStatus(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};
