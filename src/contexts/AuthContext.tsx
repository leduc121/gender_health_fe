"use client";

import { useToast } from "@/components/ui/use-toast";
import { API_ENDPOINTS } from "@/config/api";
import { apiClient } from "@/services/api";
import { User } from "@/services/user.service"; // Import User from user.service
import tokenMethod from "@/utils/token";
import { useRouter } from "next/navigation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type { User };

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
  newRefreshToken: string;
}

export interface RegisterDto {
  // Export the interface
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: "M" | "F" | "O";
  phone: string;
  address: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setAccessToken: (accessToken: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;

    console.log("[AuthContext] Initializing...");

    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      console.log("[AuthContext] Found access token, setting headers");
      apiClient.setDefaultHeaders({
        Authorization: `Bearer ${accessToken}`,
      });
      // Try to check auth with existing token
      checkAuth();
    } else {
      setIsLoading(false);
      console.log("[AuthContext] No access token found, not authenticated.");
    }
  }, []);

  const checkAuth = async () => {
    try {
      console.log("[AuthContext] Checking auth...");
      const userData = await apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
      console.log("[AuthContext] Auth successful:", userData);
      const userWithFullName = {
        ...userData,
        fullName:
          `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
      };
      setUser(userWithFullName);
      // Set cookie với token thật
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        document.cookie = `auth-token=${accessToken}; path=/; max-age=86400`;
      }
    } catch (error: any) {
      console.log("[AuthContext] Auth failed:", error);
    } finally {
      setIsLoading(false);
      console.log("[AuthContext] Auth ready");
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });
      const data = response;
      if (data && data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        document.cookie = `auth-token=${data.accessToken}; path=/; max-age=86400`;
        tokenMethod.set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
        apiClient.setDefaultHeaders({
          Authorization: `Bearer ${data.accessToken}`,
        });
        // Lấy lại user đầy đủ từ backend
        const freshUser = await apiClient.get<User>("/users/me");
        const freshUserWithFullName = {
          ...freshUser,
          fullName:
            `${freshUser.firstName || ""} ${freshUser.lastName || ""}`.trim(),
        };
        setUser(freshUserWithFullName);
        localStorage.setItem("userId", freshUser.id);
        console.log("[AuthContext] Login successful:", freshUser);
      } else {
        throw new Error(
          "Đăng nhập thất bại: Không tìm thấy accessToken trong response"
        );
      }
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn quay trở lại!",
      });
      // Redirect based on user role
      const userRole =
        typeof data.user.role === "object"
          ? data.user.role.name
          : data.user.role;
      if (data && data.user && userRole === "admin") {
        router.push("/admin");
      } else if (data && data.user && userRole === "consultant") {
        router.push("/consultant");
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("[AuthContext] Login error:", error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      console.log("[AuthContext] Attempting registration...");
      await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      toast({
        title: "Đăng ký thành công",
        description: "Vui lòng kiểm tra email để xác thực tài khoản",
      });
      router.push("/auth/verify-email");
    } catch (error: any) {
      console.error("[AuthContext] Registration error:", error); // Log the full error object
      let errorMessage = "Có lỗi xảy ra";
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Use error.message for generic errors
        errorMessage = error.message;
      }
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logoutUser = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    document.cookie =
      "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"; // Clear auth-token cookie
    apiClient.removeDefaultHeader("Authorization");
    setUser(null);
    router.push("/");
  }, [router]);

  const logout = async () => {
    try {
      console.log("[AuthContext] Logging out...");
      logoutUser();
      toast({
        title: "Đăng xuất thành công",
        description: "Hẹn gặp lại bạn!",
      });
    } catch (error) {
      console.error("[AuthContext] Logout error:", error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra",
        variant: "destructive",
      });
    }
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
      }}
    >
      {children}
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
