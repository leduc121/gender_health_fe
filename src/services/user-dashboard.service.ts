import { API_ENDPOINTS } from "@/config/api";
import axiosInstance from "@/utils/axiosInstance";

export interface UserOverview {
  overview: {
    totalUsers: number;
    totalActiveUsers: number;
    totalInactiveUsers: number;
  };
  customers: {
    totalCustomers: number;
    activeCustomers: number;
    inactiveCustomers: number;
    newCustomersThisMonth: number;
  };
  consultants: {
    totalConsultants: number;
    activeConsultants: number;
    inactiveConsultants: number;
    consultantsWithProfile: number;
  };
}

export const dashboardService = {
  getUserOverview: async (): Promise<UserOverview> => {
    const response = await axiosInstance.get(
      API_ENDPOINTS.USER_DASHBOARD.OVERVIEW
    );
    return response.data;
  },
  getMonthlyRevenue: async (year: number, month: number): Promise<number> => {
    const response = await axiosInstance.get(
      API_ENDPOINTS.REVENUE_STATS.MONTHLY,
      {
        params: {
          year,
          month,
        },
      }
    );
    return response.data;
  },
};
