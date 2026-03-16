// frontend/src/api/axiosBaseQuery.js
import axiosInstance from './axiosInstance';

const axiosBaseQuery =
  ({ baseUrl = '' } = {}) =>
  async ({ url, method, data, params, responseType }) => {
    try {
      const result = await axiosInstance({
        url: baseUrl + url,
        method,
        data,
        params,
        responseType,
      });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

export default axiosBaseQuery;
