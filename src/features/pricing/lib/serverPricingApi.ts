import { cookies } from "next/headers";

import type { Plan } from "../api/pricingApi";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function getPlansServer(activeOnly = true): Promise<Plan[]> {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("auth_token");

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (authCookie) {
      headers["Authorization"] = `Bearer ${authCookie.value}`;
    }

    const response = await fetch(
      `${API_BASE_URL}/payments/plans?active_only=${activeOnly}`,
      {
        headers,
        next: { revalidate: 300 }, // Revalidate every 5 minutes
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch plans: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching plans server-side:", error);
    // Return empty array instead of throwing to allow graceful fallback
    return [];
  }
}
