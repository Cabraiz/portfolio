import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { authApiSlice, User } from "../../feature/auth/authApiSlice";
import type { RootState } from "../../app/store";
import { DisplayUser } from "../../app/models/DisplayUser.interface";
import { Jwt } from "../../app/models/Jwt";
import { NewUser } from "../../app/models/NewUser";

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
  jwt: null,  // jwt,
  isAuthenticated: false,
  isLoading: false, 
  isSucess: false, 
  isError: false,
}

export const register = createAsyncThunk(
  'auth/register',
  async (user: NewUser, thunkAPI) => {
  try{
    
  } catch(err){
    return thunkAPI.rejectWithValue('Não foi possível registrar!')
  }
})

const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    tokenReceived: (state, action: PayloadAction<any>) => {
      const { user, acessToken } = action.payload;
      state.user = user;
      state.token = acessToken;
    },
    loggedOut: (state) => {
      state.user = null;
      state.token = null;
    },
  },
  extraReducers: (builder) => {
    //REGISTER
    builder.addCase()
  },
});

export const { tokenReceived, loggedOut } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectCurrentToken = (state: RootState) => state.auth.token;
