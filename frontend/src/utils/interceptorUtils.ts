import { AxiosError } from "axios";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";

import {
    showFeatureRestrictedToast,
    showRateLimitToast,
    showTokenLimitToast,
} from "@/components/shared/RateLimitToast";

// Types
interface ErrorHandlerDependencies {
    setLoginModalOpen: (open: boolean) => void;
    router: AppRouterInstance;
}

// Constants
const LANDING_ROUTES = [
    "/", "/terms", "/privacy", "/login", "/signup",
    "/contact", "/about", "/blog", "/pricing"
];

// Utility functions
export const isOnLandingRoute = (pathname: string): boolean => {
    return LANDING_ROUTES.includes(pathname);
};

// Main error processor
export const processAxiosError = (
    error: AxiosError,
    pathname: string,
    { setLoginModalOpen, router }: ErrorHandlerDependencies
): void => {
    console.error("Axios Error:", error, "Pathname:", pathname);

    // Skip error handling on landing pages
    if (isOnLandingRoute(pathname)) {
        return;
    }

    // Handle network errors
    if (error.code === "ERR_CONNECTION_REFUSED" || error.code === "ERR_NETWORK") {
        toast.error("Server unreachable. Try again later");
        return;
    }

    // Handle HTTP errors
    if (error.response) {
        const { status, data } = error.response;

        switch (status) {
            case 401:
                toast.error("Session expired. Please log in again.");
                setLoginModalOpen(true);
                break;

            case 403:
                handleForbiddenError(data, router);
                break;

            case 429:
                handleRateLimitError(data);
                break;

            default:
                if (status >= 500) {
                    toast.error("Server error. Please try again later.");
                }
                break;
        }
    }
};

// Handle 403 Forbidden errors
const handleForbiddenError = (errorData: unknown, router: AppRouterInstance): void => {
    const detail = (errorData as any)?.detail;

    // Handle integration errors with redirect action
    if (typeof detail === "object" && detail?.type === "integration") {
        toast.error(detail.message || "Integration required.", {
            duration: Infinity,
            classNames: {
                actionButton: "bg-red-500/30! py-4! px-3!"
            },
            action: {
                label: "Connect",
                onClick: () => router.push("/settings?section=integrations"),
            },
        });
    } else {
        // Handle generic forbidden errors
        const message = typeof detail === "string"
            ? detail
            : "You don't have permission to access this resource.";
        toast.error(message);
    }
};

// Handle 429 Rate Limit errors
const handleRateLimitError = (errorData: unknown): void => {
    const rateLimitData = (errorData as any)?.detail;

    // Validate rate limit error structure
    if (typeof rateLimitData !== "object" || rateLimitData?.error !== "rate_limit_exceeded") {
        return;
    }

    const { feature, plan_required, reset_time, message } = rateLimitData;

    if (plan_required) {
        showFeatureRestrictedToast(feature || "This feature", plan_required);
    } else if (feature?.includes("token")) {
        showTokenLimitToast(feature, plan_required);
    } else {
        showRateLimitToast({
            title: "Rate Limit Exceeded",
            message: message || undefined,
            resetTime: reset_time,
            feature,
            showUpgradeButton: true,
        });
    }
};
