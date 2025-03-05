import { apiauth } from "@/utils/apiaxios";
import { Dispatch, SetStateAction, useEffect } from "react";
import { useRouter } from "next/router";
import { publicPages } from "./useFetchUser";

export default function useAxiosInterceptor(
  setModalOpen: Dispatch<SetStateAction<boolean>>
) {
  const router = useRouter();

  useEffect(() => {
    const interceptor = apiauth.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          error.response &&
          error.response.status === 401 &&
          !publicPages.includes(router.pathname)
        ) {
          // toast.error("Session expired. Please log in again.");
          setModalOpen(true);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiauth.interceptors.response.eject(interceptor);
    };
  }, [router.pathname]);
}
