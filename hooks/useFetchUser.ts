import { useUserActions } from "@/hooks/useUser";
import { apiauth } from "@/utils/apiaxios";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export const authPages = ["/login", "/signup", "/get-started"];
export const publicPages = [...authPages, "/terms", "/privacy", "/contact"];

const useFetchUser = () => {
  const { updateUser, clearUser } = useUserActions();
  const searchParams = useSearchParams();

  const router = useRouter();

  const fetchUserInfo = async () => {
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
    } catch (err) {
      clearUser();
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, [searchParams]);
};

export default useFetchUser;
