import { apiauth } from "@/utils/apiaxios";
import { usePathname } from "next/navigation";
import { Dispatch, SetStateAction, useEffect } from "react";
import { publicPages } from "./useFetchUser";

export default function useAxiosInterceptor(
  setModalOpen: Dispatch<SetStateAction<boolean>>
) {
  const pathname = usePathname();
  useEffect(() => {
    const interceptor = apiauth.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          error.response &&
          error.response.status === 401 &&
          !publicPages.includes(pathname)
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
  }, [pathname]);
}
