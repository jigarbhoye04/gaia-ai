"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

import { authApi } from "@/features/auth/api/authApi";
import { useUserActions } from "@/features/auth/hooks/useUser";

export const authPages = ["/login", "/signup", "/signup"];
export const publicPages = [...authPages, "/terms", "/privacy", "/contact"];

const useFetchUser = () => {
  const { updateUser, clearUser } = useUserActions();
  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchUserInfo = useCallback(async () => {
    try {
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");

      const data = await authApi.fetchUserInfo();

      updateUser({
        name: data?.name,
        email: data?.email,
        profilePicture: data?.picture,
      });

      if (accessToken && refreshToken) router.push("/c");
    } catch (e: unknown) {
      console.error("Error fetching user info:", e);
      clearUser();
    }
  }, [searchParams, updateUser, clearUser, router]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  return { fetchUserInfo };
};

export default useFetchUser;
