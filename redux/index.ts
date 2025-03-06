import { configureStore } from "@reduxjs/toolkit";
import loginModalReducer from "./slices/loginModalSlice";

export const store = configureStore({
  reducer: { loginModal: loginModalReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
