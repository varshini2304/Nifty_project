// frontend/src/store/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const parseExpiresIn = (expiresIn) => {
  if (!expiresIn || typeof expiresIn !== 'string') {
    return 0;
  }
  const match = expiresIn.match(/^(\d+)([smhd])$/i);
  if (!match) {
    return 0;
  }
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === 's') return value * 1000;
  if (unit === 'm') return value * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  if (unit === 'd') return value * 24 * 60 * 60 * 1000;
  return 0;
};

const initialState = {
  token: null,
  username: null,
  role: null,
  expiresAt: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, username, role, expiresIn } = action.payload;
      const ttl = parseExpiresIn(expiresIn);
      state.token = token;
      state.username = username;
      state.role = role;
      state.expiresAt = Date.now() + ttl;
    },
    logout: (state) => {
      state.token = null;
      state.username = null;
      state.role = null;
      state.expiresAt = null;
    },
  },
});

export const selectIsAuthenticated = (state) =>
  state.auth.token !== null && state.auth.expiresAt > Date.now();

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
