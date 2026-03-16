// frontend/src/store/api/tradesApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '../../api/axiosBaseQuery';
import axiosInstance from '../../api/axiosInstance';

export const tradesApi = createApi({
  reducerPath: 'tradesApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Trades'],
  endpoints: (builder) => ({
    getTrades: builder.query({
      query: (params) => ({
        url: '/trades',
        method: 'GET',
        params,
      }),
      providesTags: ['Trades'],
    }),
    batchSaveTrades: builder.mutation({
      query: (body) => ({
        url: '/trades/batch-save',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Trades'],
    }),
    deleteTrade: builder.mutation({
      query: (tradeNo) => ({
        url: `/trades/${tradeNo}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Trades'],
    }),
    getTradesByStock: builder.query({
      query: ({ code, asOfDate }) => ({
        url: `/trades/by-stock/${code}`,
        method: 'GET',
        params: { asOfDate },
      }),
    }),
    exportTradesCsv: builder.query({
      async queryFn(params) {
        try {
          const response = await axiosInstance.get('/trades/export-csv', {
            params,
            responseType: 'blob',
          });
          return { data: response.data };
        } catch (error) {
          return {
            error: {
              status: error.response?.status,
              data: error.response?.data || error.message,
            },
          };
        }
      },
    }),
    importTradesCsv: builder.mutation({
      async queryFn(file) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const response = await axiosInstance.post('/trades/import-csv', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return { data: response.data };
        } catch (error) {
          return {
            error: {
              status: error.response?.status,
              data: error.response?.data || error.message,
            },
          };
        }
      },
      invalidatesTags: ['Trades'],
    }),
  }),
});

export const {
  useGetTradesQuery,
  useLazyGetTradesQuery,
  useBatchSaveTradesMutation,
  useDeleteTradeMutation,
  useGetTradesByStockQuery,
  useLazyExportTradesCsvQuery,
  useImportTradesCsvMutation,
} = tradesApi;
