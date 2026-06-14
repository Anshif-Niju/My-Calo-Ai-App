import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, User } from "../../types/auth.types";

const initialState: AuthState = {
  user: null,
  requiresTwoFactor: false,
  tempToken: null,
  isInitialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: User }>) => {
      state.user = action.payload.user;
      state.requiresTwoFactor = false;
      state.tempToken = null;
    },
    setTwoFactorRequired: (state, action: PayloadAction<{ tempToken: string }>) => {
      state.requiresTwoFactor = true;
      state.tempToken = action.payload.tempToken;
    },
    logoutAction: (state) => {
      state.user = null;
      state.requiresTwoFactor = false;
      state.tempToken = null;
      state.isInitialized = true;
    },
    updateUser: (state, action) => {
      state.user = action.payload;
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
  },
});

export const { setUser, setTwoFactorRequired, setInitialized, logoutAction, updateUser } = authSlice.actions;
export default authSlice.reducer;
