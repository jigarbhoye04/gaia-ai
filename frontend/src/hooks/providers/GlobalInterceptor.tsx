"use client";

import useAxiosInterceptor from "@/hooks/api/useAxiosInterceptor";

const GlobalInterceptor = () => {
  useAxiosInterceptor();
  return null;
};

export default GlobalInterceptor;
