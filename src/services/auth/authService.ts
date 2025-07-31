import { API_ENDPOINTS } from "@/config/api";
import axiosInstance from "@/utils/axiosInstance";
import { UserEntity } from "../users/userTypes";
import { LoginResponse, LoginUserPayload } from "./authTypes";

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
  getMe: async (): Promise<UserEntity> => {
    return await axiosInstance.get(API_ENDPOINTS.AUTH.ME);
  },
};
