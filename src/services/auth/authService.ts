import { API_ENDPOINT } from "@/constants/api-endpoint";
import axiosInstance from "@/utils/axiosInstance";
import { LoginResponse, LoginUserPayload } from "./authTypes";

export const authService = {
  login: async ({
    email,
    password,
  }: LoginUserPayload): Promise<LoginResponse> => {
    return await axiosInstance.post(API_ENDPOINT.AUTH.LOGIN, {
      email,
      password,
    });
  },
  loginGoogle: async (token: string) => {
    return await axiosInstance.post(API_ENDPOINT.AUTH.GOOGLE.AUTHENTICATE, {
      token,
    });
  },
};
