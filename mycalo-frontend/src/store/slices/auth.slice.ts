import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, User } from "../../types/auth.types";

const initialState: AuthState = {
  user: null,
  isInitialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: User }>) => {
      state.user = action.payload.user;
    },
    logoutAction: (state) => {
      state.user = null;
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

export const { setUser, setInitialized, logoutAction, updateUser } = authSlice.actions;
export default authSlice.reducer;
