import { apiauth } from "@/lib/api/client";

export interface SupportRequest {
  type: "support" | "feature";
  title: string;
  description: string;
}

export interface SupportResponse {
  success: boolean;
  message: string;
  ticket_id?: string;
}

class SupportApiService {
  /**
   * Submit a support or feature request
   */
  async submitRequest(requestData: SupportRequest): Promise<SupportResponse> {
    try {
      const response = await apiauth.post<SupportResponse>(
        "support/requests",
        requestData,
      );
      return response.data;
    } catch (error) {
      console.error("Error submitting support request:", error);
      throw new Error("Failed to submit support request");
    }
  }
}

export const supportApi = new SupportApiService();
