"use client";

import { apiauth } from "@/utils/apiaxios";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { useLoginModalActions } from "./useLoginModal";

export default function useAxiosInterceptor() {
  const { setLoginModalOpen } = useLoginModalActions();
  const pathname = usePathname();

  useEffect(() => {
    const interceptor = apiauth.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          if (
            ![
              "/",
              "terms",
              "privacy",
              "login",
              "get-started",
              "contact",
            ].includes(pathname)
          ) {
            // Only open modal if not on these routes
            toast.error("Session expired. Please log in again.");
            setLoginModalOpen(true);
          }
        } else {
          console.log("test interceptpr");
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiauth.interceptors.response.eject(interceptor);
    };
  }, [pathname]);
}
