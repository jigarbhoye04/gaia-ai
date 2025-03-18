// src/hooks/useLoginModal.ts
import { useDispatch,useSelector } from "react-redux";

import { setLoginModalOpen } from "@/redux/slices/loginModalSlice";
import type { AppDispatch,RootState } from "@/redux/store";

export const useLoginModal = () => {
  return useSelector((state: RootState) => state.loginModal.open);
};

export const useLoginModalActions = () => {
  const dispatch: AppDispatch = useDispatch();

  return {
    setLoginModalOpen: (open: boolean) => dispatch(setLoginModalOpen(open)),
  };
};
