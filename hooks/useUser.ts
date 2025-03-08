import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { setUser, clearUser } from "@/redux/slices/userSlice";

export const useUser = () => useSelector((state: RootState) => state.user);

export const useUserActions = () => {
  const dispatch: AppDispatch = useDispatch();

  return {
    updateUser: (userData: {
      profilePicture: string;
      name: string;
      email: string;
    }) => dispatch(setUser(userData)),

    clearUser: () => dispatch(clearUser()),
  };
};
