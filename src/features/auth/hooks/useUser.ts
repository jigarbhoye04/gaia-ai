import { useDispatch, useSelector } from "react-redux";

import { clearUser, setUser, UserState } from "@/redux/slices/userSlice";
import type { AppDispatch, RootState } from "@/redux/store";

export const useUser = () => useSelector((state: RootState) => state.user);

export const useUserActions = () => {
  const dispatch: AppDispatch = useDispatch();

  return {
    updateUser: (userData: UserState) => dispatch(setUser(userData)),

    clearUser: () => dispatch(clearUser()),
  };
};
