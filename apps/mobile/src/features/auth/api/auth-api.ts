/**
 * Auth API Service
 * Handles authentication-related API calls
 */

import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

// OAuth requires raw fetch with different base URL (no /api/v1 suffix)
const OAUTH_BASE_URL = __DEV__
  ? Platform.OS === "android"
    ? "http://10.0.2.2:8000"
    : "http://192.168.1.126:8000"
  : "https://api.heygaia.io";

WebBrowser.maybeCompleteAuthSession();

// ============================================================================
// Types
// ============================================================================

export interface LoginUrlResponse {
  url: string;
}

export interface UserInfoResponse {
  name: string;
  email: string;
  picture?: string;
  user_id?: string;
}

// ============================================================================
// OAuth API (requires raw fetch - no cookie auth)
// ============================================================================

/**
 * Get the OAuth login URL from the server
 */
export async function getLoginUrl(): Promise<string> {
  try {
    const response = await fetch(
      `${OAUTH_BASE_URL}/api/v1/oauth/login/workos/mobile`
    );

    if (!response.ok) {
      throw new Error("Failed to get login URL");
    }

    const data: LoginUrlResponse = await response.json();
    return data.url;
  } catch (error) {
    console.error("Error getting login URL:", error);
    throw new Error("Failed to initiate login");
  }
}

/**
 * Start the OAuth flow using WebBrowser
 * Returns the auth token on success
 */
export async function startOAuthFlow(): Promise<string> {
  try {
    const authUrl = await getLoginUrl();

    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      "giamobile://auth/callback"
    );

    if (result.type === "success" && result.url) {
      const url = new URL(result.url);
      const token = url.searchParams.get("token");

      if (!token) {
        throw new Error("No token received from authentication");
      }
      return token;
    } else if (result.type === "cancel") {
      throw new Error("Authentication was cancelled");
    } else {
      throw new Error("Authentication failed");
    }
  } catch (error) {
    console.error("OAuth flow error:", error);
    throw error;
  }
}

/**
 * Fetch user info from the server
 */
export async function fetchUserInfo(token: string): Promise<UserInfoResponse> {
  try {
    const response = await fetch(`${OAUTH_BASE_URL}/api/v1/user/me`, {
      method: "GET",
      headers: {
        Cookie: `wos_session=${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user info");
    }

    const data = await response.json();
    return {
      name: data.name || "",
      email: data.email || "",
      picture: data.picture,
      user_id: data.user_id,
    };
  } catch (error) {
    console.error("Error fetching user info:", error);
    throw new Error("Failed to fetch user information");
  }
}

/**
 * Logout from the server
 */
export async function logout(token: string): Promise<void> {
  try {
    await fetch(`${OAUTH_BASE_URL}/api/v1/oauth/logout`, {
      method: "POST",
      headers: {
        Cookie: `wos_session=${token}`,
      },
      credentials: "include",
    });
  } catch (error) {
    console.error("Error during logout:", error);
  }
}

// ============================================================================
// Bundled API object (for consistent pattern with chat feature)
// ============================================================================

export const authApi = {
  getLoginUrl,
  startOAuthFlow,
  fetchUserInfo,
  logout,
};
