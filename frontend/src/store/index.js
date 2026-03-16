// frontend/src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import { authApi } from './api/authApi';
import { tradesApi } from './api/tradesApi';
import { stocksApi } from './api/stocksApi';
import { monitorApi } from './api/monitorApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [tradesApi.reducerPath]: tradesApi.reducer,
    [stocksApi.reducerPath]: stocksApi.reducer,
    [monitorApi.reducerPath]: monitorApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      tradesApi.middleware,
      stocksApi.middleware,
      monitorApi.middleware
    ),
});

export default store;
