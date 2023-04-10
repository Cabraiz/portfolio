import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { DisplayUser } from "../../app/models/DisplayUser.interface";
import { Jwt } from "../../app/models/Jwt";
import { NewUser } from "../../app/models/NewUser";
import authSevice from "../../app/services/auth.service";
import { apiSlice } from "../../app/api/apiSlice";

// TODO: move higher
interface AsyncState {
  isLoading: boolean;
  isSucess: boolean;
  isError: boolean;
}

interface AuthState extends AsyncState {
  user?: DisplayUser | null;
  jwt?: Jwt;
  isAuthenticated?: boolean;
}

const initialState: AuthState = {
  user: null, // user,
  jwt: null, // jwt,
  isAuthenticated: false,
  isLoading: false,
  isSucess: false,
  isError: false,
};

export const register = createAsyncThunk(
  "auth/register",
  async (user: NewUser, thunkAPI) => {
    try {
      return await authSevice.register(user);
    } catch (err) {
      return thunkAPI.rejectWithValue("Não foi possível registrar!");
    }
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSucess = false;
      state.isError = false;
    },
    tokenReceived: (
      state,
      action: PayloadAction<{ user: DisplayUser; jwt: Jwt }>
    ) => {
      const { user, jwt } = action.payload;
      state.user = user;
      state.jwt = jwt;
      state.isAuthenticated = true;
    },
    logOut: (state) => {
      state.user = null;
      state.jwt = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      //REGISTER
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSucess = true;
        state.user = action.payload;
      })
      .addCase(register.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
        state.user = null;
      });
  },
});

export const { reset, tokenReceived, logOut } = authSlice.actions;

export const selectedUser = (state: RootState) => {
  return state.auth;
}

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectCurrentToken = (state: RootState) => state.auth.jwt;

export default authSlice.reducer;