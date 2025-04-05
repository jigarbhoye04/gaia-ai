"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { apiauth } from "@/utils/apiaxios";

import { useLoginModalActions } from "./useLoginModal";

export default function useAxiosInterceptor() {
  const { setLoginModalOpen } = useLoginModalActions();
  const pathname = usePathname();

  useEffect(() => {
    const onLandingRoutes = [
      "/",
      "/terms",
      "/privacy",
      "/login",
      "/get-started",
      "/contact",
      "/about",
      "/blog",
      "/pricing",
    ].includes(pathname);

    // console.log("Axios Interceptor Pathname:", pathname, onLandingRoutes);

    const interceptor = apiauth.interceptors.response.use(
      (response) => response,
      (error) => {
        try {
          console.error("Axios Error:", error, "Pathname:", pathname);

          if (onLandingRoutes) return Promise.reject(error);

          if (
            error.code === "ERR_CONNECTION_REFUSED" ||
            error.code === "ERR_NETWORK"
          )
            toast.error("Server unreachable. Try again later");

          if (error.response) {
            const { status } = error.response;

            if (status === 401) {
              toast.error("Session expired. Please log in again.");
              setLoginModalOpen(true);
            } else if (status >= 500)
              toast.error("Server error. Please try again later.");
            else if (status === 404)
              toast.error("Resource not found. Please check the URL.");
          }
        } catch (handlerError) {
          console.error("Error handling axios interceptor:", handlerError);
          if (!onLandingRoutes) toast.error("An unexpected error occurred.");
        }

        return Promise.reject(error);
      },
    );

    return () => {
      apiauth.interceptors.response.eject(interceptor);
    };
  }, [pathname, setLoginModalOpen]);
}
