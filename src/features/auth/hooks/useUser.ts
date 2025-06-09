import { useDispatch, useSelector } from "react-redux";

import {
  clearUser,
  setUser,
  updateUser,
  UserState,
} from "@/redux/slices/userSlice";
import type { AppDispatch, RootState } from "@/redux/store";

export const useUser = () => useSelector((state: RootState) => state.user);

export const useUserActions = () => {
  const dispatch: AppDispatch = useDispatch();

  return {
    setUser: (userData: UserState) => dispatch(setUser(userData)),
    updateUser: (userData: Partial<UserState>) =>
      dispatch(updateUser(userData)),
    clearUser: () => dispatch(clearUser()),
  };
};
