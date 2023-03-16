import { createSlice } from '@reduxjs/toolkit'
import { User } from '../../app/api/apiSlice'
import type { RootState } from "../../app/api/store"

type AuthState = {
    user: User | null
    token: string | null
}

const authSlice = createSlice({
    name: 'auth',
    initialState: { user: null, token: null } as AuthState,
    reducers: {
        tokenReceived: (state, action) => {
            const { user, acessToken } = action.payload
            state.user = user
            state.token = acessToken
        },
        loggedOut: (state, action) => {
            state.user = null
            state.token = null
        }
    },
})

export const { tokenReceived, loggedOut } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectCurrentToken = (state: RootState) => state.auth.token;