import { useDispatch,useSelector } from "react-redux";

import { clearUser,setUser } from "@/redux/slices/userSlice";
import type { AppDispatch,RootState } from "@/redux/store";

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
