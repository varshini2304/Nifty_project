// frontend/src/store/api/monitorApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../api/axiosBaseQuery';

export const monitorApi = createApi({
  reducerPath: 'monitorApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    getMonitorPL: builder.query({
      query: (date) => ({
        url: '/monitor/pl',
        method: 'GET',
        params: { date },
      }),
    }),
  }),
});

export const { useGetMonitorPLQuery } = monitorApi;
