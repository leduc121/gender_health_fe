import { RolesNameEnum } from "@/types/apiEnumTypes";
import { ApiResponse } from "@/types/commonTypes";

export interface LoginUserPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: {
      id: string;
      name: RolesNameEnum;
      description: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: null;
    };
    emailVerified: boolean;
  };
}

export type LoginResponse = ApiResponse<LoginResponseData>;
