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
    const interceptor = apiauth.interceptors.response.use(
      (response) => response,
      (error) => {

        const onLandingRoutes = ![
          "/",
          "/terms",
          "/privacy",
          "/login",
          "/get-started",
          "/contact",
          "/about",
          "/blog",
          "/pricing",
        ].includes(pathname)

        console.error(error, pathname);

        if ((error.code === "ERR_CONNECTION_REFUSED" || error.code == "ERR_NETWORK") && onLandingRoutes)
          toast.error(
            "Unable to connect to the server. Please try again later.",
          );

        if (error.response && error.response.status === 401 && onLandingRoutes) {
          console.log(pathname)
          toast.error("Session expired. Please log in again.");
          setLoginModalOpen(true);
        }

        return Promise.reject(error);
      },
    );

    return () => {
      apiauth.interceptors.response.eject(interceptor);
    };
  }, [pathname, setLoginModalOpen]);
}
