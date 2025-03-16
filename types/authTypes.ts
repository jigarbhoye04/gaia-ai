// Authentication related types
import { ReactNode } from "react";

// User types
export interface UserData {
  profilePicture: string;
  name: string;
  email: string;
}

// Auth component props
export interface LoginSignupProps {
  isLogin?: boolean;
}

// Auth state
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth provider props
export interface AuthProviderProps {
  children: ReactNode;
}

// OAuth response
export interface OAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

// Auth modal props
export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: 'login' | 'signup';
}