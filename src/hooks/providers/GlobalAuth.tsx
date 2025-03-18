"use client";
// This GlobalAuth file is required because it requires the ReduxProvider wrapped around it

import useFetchUser from "@/hooks/useFetchUser";

const GlobalAuth = () => {
  useFetchUser();
  return null;
};

export default GlobalAuth;
