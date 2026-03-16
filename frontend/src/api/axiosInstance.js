// frontend/src/api/axiosInstance.js
import axios from 'axios';
import { logout } from '../store/authSlice';

let storeRef = null;

export const setAxiosStore = (store) => {
  storeRef = store;
};

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = storeRef?.getState?.().auth?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 && storeRef) {
      storeRef.dispatch(logout());
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
