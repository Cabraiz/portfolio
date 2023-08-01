import { apiSlice } from "../../app/api/apiSlice";
import { logOut } from "../auth/authSlice";

export interface User {
  first_name: string;
  last_name: string;
}

export interface UserResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<UserResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/loginhublocal",
        method: "POST",
        body: { ...credentials },
      }),
    }),
    sendLogout: builder.mutation({
      query: () => ({
        url: "/logout",
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(logOut());
          dispatch(apiSlice.util.resetApiState());
        } catch (err) {
          console.log(err);
        }
      },
    }),
    protected: builder.mutation<{ message: string }, void>({
      query: () => "protected",
    }),
  }),
});

export const { useLoginMutation, useSendLogoutMutation, useProtectedMutation } =
  authApiSlice;
