// frontend/src/store/api/authApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../api/axiosBaseQuery';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        data: credentials,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    getMe: builder.query({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
      }),
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useGetMeQuery } = authApi;
