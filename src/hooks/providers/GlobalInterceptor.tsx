"use client";

import useAxiosInterceptor from "@/hooks/useAxiosInterceptor";

const GlobalInterceptor = () => {
  useAxiosInterceptor();
  return null;
};

export default GlobalInterceptor;
