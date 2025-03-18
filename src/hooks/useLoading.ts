"use client";
import { setIsLoading } from "@/redux/slices/loadingSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";

export const useLoading = () => {
  const dispatch: AppDispatch = useDispatch();
  const isLoading = useSelector((state: RootState) => state.loading.isLoading);

  const setLoadingState = (loading: boolean) => {
    dispatch(setIsLoading(loading));
  };

  return {
    isLoading,
    setIsLoading: setLoadingState,
  };
};
