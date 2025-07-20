"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/services/api";
import { API_ENDPOINTS } from "@/config/api";

// 1. Thêm 'healthDataConsent' vào User interface
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  role:
    | string
    | { id: string; name: string; description?: string; [key: string]: any };
  profilePicture?: string;
  phone?: string;
  address?: string;
  gender?: "M" | "F" | "O" | string;
  healthDataConsent?: boolean; // Dòng này đã được thêm
}

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface ApiError {
  status: number;
  message: string;
  data?: any;
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: "M" | "F" | "O";
  phone: string;
  address: string;
}

// 2. Thêm 'refreshUser' vào AuthContextType
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (accessToken: string) => void;
  refreshUser: () => Promise<void>; // Dòng này đã được thêm
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const logoutUser = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    document.cookie =
      "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    apiClient.removeDefaultHeader("Authorization");
    setUser(null);
    router.push("/");
  }, [router]);

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("No refresh token");
      const response = await apiClient.post<RefreshTokenResponse>(
        API_ENDPOINTS.AUTH.REFRESH_TOKEN,
        { refreshToken }
      );
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      apiClient.setDefaultHeaders({
        Authorization: `Bearer ${response.accessToken}`,
      });
      return response;
    } catch (error) {
      logoutUser(); // Đăng xuất nếu refresh token thất bại
      throw error;
    }
  };

  // 3. Triển khai hàm refreshUser
  const refreshUser = useCallback(async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
        setIsLoading(false);
        setIsAuthReady(true);
        return;
    }

    try {
      apiClient.setDefaultHeaders({ Authorization: `Bearer ${accessToken}` });
      const userData = await apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
      const userWithFullName = {
        ...userData,
        fullName: `${userData.firstName || ""} ${
          userData.lastName || ""
        }`.trim(),
      };
      setUser(userWithFullName);
    } catch (error: any) {
      if (error.status === 401) {
        try {
          await refreshToken();
          const freshUserData = await apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
          const userWithFullName = {
            ...freshUserData,
            fullName: `${freshUserData.firstName || ""} ${
              freshUserData.lastName || ""
            }`.trim(),
          };
          setUser(userWithFullName);
        } catch (refreshError) {
          // Lỗi đã được xử lý trong refreshToken -> logoutUser
        }
      } else {
         // Không đăng xuất với các lỗi khác, chỉ báo lỗi
         console.error("Failed to fetch user:", error);
      }
    } finally {
      setIsLoading(false);
      setIsAuthReady(true);
    }
  }, [logoutUser]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });
      const data = response;
      if (data && data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        await refreshUser(); // Lấy thông tin người dùng mới nhất
        toast({
          title: "Đăng nhập thành công",
          description: "Chào mừng bạn quay trở lại!",
        });
        const userRole = typeof data.user.role === "object" ? data.user.role.name : data.user.role;
        if (userRole === "admin") router.push("/admin");
        else if (userRole === "consultant") router.push("/consultant");
        else router.push("/");
      } else {
        throw new Error("Response không chứa access token.");
      }
    } catch (error) {
      console.error("[AuthContext] Login error:", error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Đăng nhập thất bại.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      toast({
        title: "Đăng ký thành công",
        description: "Vui lòng kiểm tra email để xác thực tài khoản.",
      });
      router.push("/auth/verify-email");
    } catch (error: any) {
      console.error("[AuthContext] Registration error:", error);
      const message = error?.response?.data?.message || "Có lỗi xảy ra khi đăng ký.";
      toast({
        title: "Lỗi",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    logoutUser();
    toast({
      title: "Đăng xuất thành công",
      description: "Hẹn gặp lại bạn!",
    });
  };

  const setAccessToken = (accessToken: string) => {
    localStorage.setItem("accessToken", accessToken);
    apiClient.setDefaultHeaders({
      Authorization: `Bearer ${accessToken}`,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isLoading,
        isAuthenticated: !!user,
        setUser,
        setAccessToken,
        refreshUser, // 4. Cung cấp hàm cho context
      }}
    >
      {isAuthReady ? children : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}