"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import {
  showFeatureRestrictedToast,
  showRateLimitToast,
  showTokenLimitToast,
} from "@/components/shared/RateLimitToast";
import { apiauth } from "@/lib/api";

import { useLoginModalActions } from "../../features/auth/hooks/useLoginModal";

export default function useAxiosInterceptor() {
  const { setLoginModalOpen } = useLoginModalActions();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onLandingRoutes = [
      "/",
      "/terms",
      "/privacy",
      "/login",
      "/signup",
      "/contact",
      "/about",
      "/blog",
      "/pricing",
    ].includes(pathname);

    const interceptor = apiauth.interceptors.response.use(
      (response) => response,
      (error) => {
        try {
          console.error("Axios Error:", error, "Pathname:", pathname);

          if (onLandingRoutes) return Promise.reject(error);

          if (
            error.code === "ERR_CONNECTION_REFUSED" ||
            error.code === "ERR_NETWORK"
          )
            toast.error("Server unreachable. Try again later");

          if (error.response) {
            const { status, data } = error.response;

            if (status === 401) {
              toast.error("Session expired. Please log in again.");
              setLoginModalOpen(true);
            } else if (status === 403) {
              // Handle OAuth scope errors
              const detail = data?.detail;
              if (typeof detail === "object" && detail?.type === "integration") {
                toast.error(detail.message || "Integration required.", {
                  duration: Infinity,
                  classNames: {
                    actionButton: "bg-red-500/30! py-4! px-3!"
                  },
                  action: {
                    label: "Connect",
                    onClick: () => {
                      router.push("/settings?section=integrations");
                    },
                  },
                });
              } else {
                const fallbackMessage = typeof detail === "string" ? detail : "You don't have permission to access this resource.";
                toast.error(fallbackMessage);
              }

            } else if (status === 429) {
              // Handle rate limiting errors
              const errorData = data?.detail;

              if (
                typeof errorData === "object" &&
                errorData?.error === "rate_limit_exceeded"
              ) {
                const { feature, plan_required, reset_time, message } =
                  errorData;

                if (plan_required) {
                  // Feature is restricted to higher tier
                  showFeatureRestrictedToast(
                    feature || "This feature",
                    plan_required,
                  );
                } else if (feature?.includes("token")) {
                  // Token limit exceeded
                  showTokenLimitToast(feature, plan_required);
                } else {
                  // General rate limit exceeded
                  showRateLimitToast({
                    title: "Rate Limit Exceeded",
                    message: message || undefined,
                    resetTime: reset_time,
                    feature,
                    showUpgradeButton: true,
                  });
                }
              }
            } else if (status >= 500)
              toast.error("Server error. Please try again later.");
          }
        } catch (handlerError) {
          console.error("Error handling axios interceptor:", handlerError);
          if (!onLandingRoutes) toast.error("An unexpected error occurred.");
        }

        return Promise.reject(error);
      },
    );

    return () => {
      apiauth.interceptors.response.eject(interceptor);
    };
  }, [pathname, setLoginModalOpen, router]);
}
