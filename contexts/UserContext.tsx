"use client";

import { apiauth } from "@/utils/apiaxios";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

interface User {
  name: string;
  email: string;
  profile_picture: string;
}

interface UserContextType {
  user: User | null;
  setUserData: (
    name: string | null,
    email: string | null,
    profile_picture: string | null
  ) => void;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const setUserData = (
    name: string | null,
    email: string | null,
    profile_picture: string | null
  ) => {
    if (name && email && profile_picture)
      setUser({ name, email, profile_picture });
    else setUser(null);
  };

  const logout = async () => {
    try {
      await apiauth.post("/oauth/logout", {}, { withCredentials: true });
      setUser(null);
      toast.success("Successfully logged out!");
    } catch (error) {
      toast.error("Could not logout");
      console.error("Error during logout:", error);
    } finally {
      router.push("/login");
    }
  };

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");

    if (accessToken && refreshToken) {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      router.replace("/c");
    }
  }, [searchParams, user, router]);

  return (
    <UserContext.Provider value={{ user, setUserData, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
