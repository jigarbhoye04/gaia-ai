"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

import { useUserActions } from "@/hooks/useUser";
import { apiauth } from "@/utils/apiaxios";

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

      const response = await apiauth.get("/oauth/me", {
        withCredentials: true,
      });

      updateUser({
        name: response?.data?.name,
        email: response?.data?.email,
        profilePicture: response?.data?.picture,
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
