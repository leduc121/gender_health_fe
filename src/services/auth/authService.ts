
import axiosInstance from "@/utils/axiosInstance";
import { LoginResponse, LoginUserPayload } from "./authTypes";
import { API_ENDPOINTS } from '@/config/api';

export const authService = {
  login: async ({
    email,
    password,
  }: LoginUserPayload): Promise<LoginResponse> => {
    return await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, {
      email,
      password,
    });
  },
  loginGoogle: async (token: string) => {
    return await axiosInstance.post(API_ENDPOINTS.AUTH.GOOGLE, {
      token,
    });
  },
};
