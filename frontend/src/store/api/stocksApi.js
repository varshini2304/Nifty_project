// frontend/src/store/api/stocksApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../api/axiosBaseQuery';

export const stocksApi = createApi({
  reducerPath: 'stocksApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    getStocks: builder.query({
      query: (params) => ({
        url: '/stocks',
        method: 'GET',
        params,
      }),
    }),
    searchStocks: builder.query({
      query: (q) => ({
        url: '/stocks/search',
        method: 'GET',
        params: { q },
      }),
    }),
  }),
});

export const { useGetStocksQuery, useLazySearchStocksQuery } = stocksApi;
