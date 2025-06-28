import { AxiosError } from "axios";

import { apiService } from "@/lib/api";

export interface Plan {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  duration: "monthly" | "yearly";
  max_users?: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentConfig {
  razorpay_key_id: string;
  currency: string;
  company_name: string;
  theme_color: string;
}

export interface CreateSubscriptionRequest {
  plan_id: string;
  quantity?: number;
  customer_notify?: boolean;
  addons?: Array<Record<string, unknown>>;
  notes?: Record<string, string>;
}

export interface PaymentCallbackData {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
}

export interface Subscription {
  id: string;
  razorpay_subscription_id: string;
  user_id: string;
  plan_id: string;
  status: string;
  quantity: number;
  current_start?: string;
  current_end?: string;
  ended_at?: string;
  charge_at?: string;
  start_at?: string;
  end_at?: string;
  auth_attempts: number;
  total_count: number;
  paid_count: number;
  customer_notify: boolean;
  created_at: string;
  updated_at: string;
  notes?: Record<string, string>;
}

export interface UserSubscriptionStatus {
  user_id: string;
  current_plan?: Plan;
  subscription?: Subscription;
  is_subscribed: boolean;
  days_remaining?: number;
  can_upgrade: boolean;
  can_downgrade: boolean;
}

// Helper function for consistent error handling
// Error response interface from backend
interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

// Helper function for consistent error handling
const handleApiError = (error: unknown, context: string): never => {
  let errorMessage = "An unexpected error occurred";
  let status: number | undefined;

  // Check if it's an AxiosError
  if (error && typeof error === "object" && "isAxiosError" in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    errorMessage =
      axiosError.response?.data?.detail ||
      axiosError.response?.data?.message ||
      axiosError.message ||
      errorMessage;
    status = axiosError.response?.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  console.error(`${context} failed:`, {
    error: errorMessage,
    status,
  });

  throw new Error(errorMessage);
};

class PricingApi {
  // Get all available plans
  async getPlans(activeOnly = true): Promise<Plan[]> {
    try {
      return await apiService.get<Plan[]>(
        `/payments/plans?active_only=${activeOnly}`,
      );
    } catch (error) {
      return handleApiError(error, "Get plans");
    }
  }

  // Get specific plan by ID
  async getPlan(planId: string): Promise<Plan> {
    try {
      return await apiService.get<Plan>(`/payments/plans/${planId}`);
    } catch (error) {
      return handleApiError(error, "Get plan");
    }
  }

  // Get payment configuration
  async getPaymentConfig(): Promise<PaymentConfig> {
    try {
      return await apiService.get<PaymentConfig>("/payments/config");
    } catch (error) {
      return handleApiError(error, "Get payment config");
    }
  }

  // Create subscription
  async createSubscription(
    data: CreateSubscriptionRequest,
  ): Promise<Subscription> {
    try {
      return await apiService.post<Subscription>(
        "/payments/subscriptions",
        data,
      );
    } catch (error) {
      return handleApiError(error, "Create subscription");
    }
  }

  // Get user subscription status
  async getUserSubscriptionStatus(): Promise<UserSubscriptionStatus> {
    try {
      return await apiService.get<UserSubscriptionStatus>(
        "/payments/subscriptions/status",
      );
    } catch (error) {
      return handleApiError(error, "Get subscription status");
    }
  }

  // Verify payment
  async verifyPayment(callbackData: PaymentCallbackData): Promise<{
    id: string;
    user_id: string;
    subscription_id?: string;
    order_id?: string;
    amount: number;
    currency: string;
    status: string;
  }> {
    try {
      return await apiService.post("/payments/verify", callbackData);
    } catch (error) {
      return handleApiError(error, "Verify payment");
    }
  }

  // Update subscription
  async updateSubscription(data: {
    plan_id?: string;
    quantity?: number;
    remaining_count?: number;
    replace_items?: boolean;
    prorate?: boolean;
  }): Promise<Subscription> {
    try {
      return await apiService.put<Subscription>(
        "/payments/subscriptions",
        data,
      );
    } catch (error) {
      return handleApiError(error, "Update subscription");
    }
  }

  // Cancel subscription
  async cancelSubscription(cancelAtCycleEnd = true): Promise<{
    message: string;
    cancel_at_cycle_end: string;
  }> {
    try {
      return await apiService.delete(
        `/payments/subscriptions?cancel_at_cycle_end=${cancelAtCycleEnd}`,
      );
    } catch (error) {
      return handleApiError(error, "Cancel subscription");
    }
  }
}

export const pricingApi = new PricingApi();
