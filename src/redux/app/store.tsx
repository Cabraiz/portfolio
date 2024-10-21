import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./api/apiSlice";
import authReducer from "../feature/auth/authSlice";
import { thunk } from "redux-thunk";
import logger from "redux-logger";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
  },
  // O middleware agora é uma função que aceita o middleware padrão e o modifica
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(thunk, apiSlice.middleware, logger),
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
