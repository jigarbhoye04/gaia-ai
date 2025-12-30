/**
 * Auth Types
 * Centralized type definitions for the auth feature
 */

export interface UserInfo {
  name: string;
  email: string;
  picture?: string;
  user_id?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserInfo | null;
}
