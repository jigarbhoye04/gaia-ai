// src/hooks/useLoginModal.ts
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { setLoginModalOpen } from "@/redux/slices/loginModalSlice";

export const useLoginModal = () => {
  return useSelector((state: RootState) => state.loginModal.open);
};

export const useLoginModalActions = () => {
  const dispatch: AppDispatch = useDispatch();

  return {
    setLoginModalOpen: (open: boolean) => dispatch(setLoginModalOpen(open)),
  };
};
