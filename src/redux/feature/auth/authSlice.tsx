import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { authApiSlice, User } from '../../feature/auth/authApiSlice'
import type { RootState } from "../../hooks/store"

type AuthState = {
    user: User | null
    token: string | null
}

const authSlice = createSlice({
    name: 'auth',
    initialState: { user: null, token: null } as AuthState,
    reducers: {
        tokenReceived: (state, action: PayloadAction<any>) => {
            const { user, acessToken } = action.payload
            state.user = user
            state.token = acessToken
        },
        loggedOut: (state) => {
            state.user = null
            state.token = null
        }
    },
    extraReducers: (builder) => {
        builder.addMatcher(
          authApiSlice.endpoints.login.matchFulfilled,
          (state, { payload }) => {
            state.token = payload.token
            state.user = payload.user
          }
        )
      },
})

export const { tokenReceived, loggedOut } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectCurrentToken = (state: RootState) => state.auth.token;