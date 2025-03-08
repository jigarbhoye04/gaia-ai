import { configureStore } from "@reduxjs/toolkit";
import loginModalReducer from "./slices/loginModalSlice";
import userReducer from "./slices/userSlice";

export const store = configureStore({
  reducer: { loginModal: loginModalReducer, user: userReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
