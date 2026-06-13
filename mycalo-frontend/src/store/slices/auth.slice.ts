import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, User } from "../../types/auth.types";

const initialState: AuthState = {
  user: null,
  accessToken: null,
  requiresTwoFactor: false,
  tempToken: null,
  isAuthInitialized: false,
  // isAuthLoading:true
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ accessToken: string; user?: User }>) => {
      state.accessToken = action.payload.accessToken;
      if (action.payload.user) {
        state.user = action.payload.user;
      }
      state.requiresTwoFactor = false;
      state.tempToken = null;
    },
    setTwoFactorRequired: (state, action: PayloadAction<{ tempToken: string }>) => {
      state.requiresTwoFactor = true;
      state.tempToken = action.payload.tempToken;
    },
    logoutAction: (state) => {
      state.user = null;
      state.accessToken = null;
      state.requiresTwoFactor = false;
      state.tempToken = null;
      state.isAuthInitialized = true;
    },
    setAuthInitialized: (state) => {
      state.isAuthInitialized = true;
    },
    updateUser: (state, action) => {
      state.user = action.payload;
    },
  },
});

export const { setCredentials, setTwoFactorRequired, logoutAction, setAuthInitialized, updateUser } = authSlice.actions;
export default authSlice.reducer;
