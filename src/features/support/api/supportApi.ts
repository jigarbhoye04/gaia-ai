export interface SupportRequest {
  type: "support" | "feature";
  title: string;
  description: string;
}

export interface SupportResponse {
  success: boolean;
  message: string;
  ticketId?: string;
}

class SupportApiService {
  /**
   * Submit a support or feature request
   */
  async submitRequest(requestData: SupportRequest): Promise<SupportResponse> {
    try {
      // Simulate API call with delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch("/api/v1/support/requests", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(requestData),
      // });
      //
      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }
      //
      // const result = await response.json();
      // return result;

      // Mock successful response
      const mockResponse: SupportResponse = {
        success: true,
        message: "Support request submitted successfully",
        ticketId: `TICKET-${Date.now()}`,
      };

      console.log("Support request submitted:", requestData);

      return mockResponse;
    } catch (error) {
      console.error("Error submitting support request:", error);
      throw new Error("Failed to submit support request");
    }
  }

  /**
   * Get support request status (for future implementation)
   */
  async getRequestStatus(): Promise<{ status: string; message: string }> {
    try {
      // TODO: Implement actual API call
      // const response = await fetch(`/api/v1/support/requests/${ticketId}`);
      // return response.json();

      // Placeholder for future implementation
      return { status: "pending", message: "Feature not implemented yet" };
    } catch (error) {
      console.error("Error fetching request status:", error);
      throw error;
    }
  }

  /**
   * Get FAQ items (for future implementation)
   */
  async getFAQ(): Promise<{ faq: unknown[]; message: string }> {
    try {
      // TODO: Implement actual API call
      // const response = await fetch("/api/v1/support/faq");
      // return response.json();

      // Placeholder for future implementation
      return { faq: [], message: "Feature not implemented yet" };
    } catch (error) {
      console.error("Error fetching FAQ:", error);
      throw error;
    }
  }
}

export const supportApi = new SupportApiService();
