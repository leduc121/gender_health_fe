
import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import tokenMethod from "./token";
import { API_BASE_URL, API_ENDPOINTS } from "@/config/api";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    const token = tokenMethod.get()?.accessToken;
    if (token) {
      // If token exists, set it in the Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  function (response: AxiosResponse) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response.data;
  },
  async function (error: AxiosError) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    console.log("error", error);
    const originalRequest = error.config;
    if (error.response?.status === 401 || error.response?.status === 403) {
      try {
        const res = await axiosInstance.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
          refreshToken: tokenMethod.get()?.refreshToken,
        });

        const { accessToken, refreshToken } = res.data?.data || {};

        tokenMethod.set({
          accessToken,
          refreshToken,
        });

        if (originalRequest) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (error) {
        console.log("Error axios response:", error);
        tokenMethod.remove();
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
