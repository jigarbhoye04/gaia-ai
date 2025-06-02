import { apiService } from "@/lib/api";

export interface UserInfo {
  name: string;
  email: string;
  picture: string;
}

export interface GoogleLoginResponse {
  url: string;
}

export const authApi = {
  // Fetch current user info
  fetchUserInfo: async (): Promise<UserInfo> => {
    return apiService.get<UserInfo>("/oauth/me", {
      silent: true,
    });
  },

  // Initiate Google login
  googleLogin: async (): Promise<GoogleLoginResponse> => {
    return apiService.get<GoogleLoginResponse>("/oauth/login/google", {
      errorMessage: "Failed to initiate Google login",
    });
  },

  // Update user profile (name/picture)
  updateProfile: async (formData: FormData): Promise<UserInfo> => {
    return apiService.patch<UserInfo>("/oauth/me", formData, {
      successMessage: "Profile updated successfully",
      errorMessage: "Failed to update profile",
    });
  },

  // Logout user
  logout: async (): Promise<void> => {
    return apiService.post("/oauth/logout", undefined, {
      successMessage: "Logged out successfully",
      errorMessage: "Failed to logout",
    });
  },
};
