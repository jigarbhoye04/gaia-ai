"use client";
import { setIsLoading } from "@/redux/slices/loadingSlice";
import { useDispatch, useSelector } from "react-redux";

export const useLoading = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loading.isLoading);

  const setLoadingState = (loading: boolean) => {
    dispatch(setIsLoading(loading));
  };

  return {
    isLoading,
    setIsLoading: setLoadingState,
  };
};
