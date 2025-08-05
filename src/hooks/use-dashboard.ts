import { dashboardService } from "@/services/user-dashboard.service";
import { useQuery } from "@tanstack/react-query";

export const useUserDashboard = () => {
  const { data: userOverview, isLoading: isLoadingUserOverview } = useQuery({
    queryKey: ["user-overview"],
    queryFn: dashboardService.getUserOverview,
  });

  return {
    userOverview,
    isLoadingUserOverview,
  };
};

export const useMonthlyRevenue = (year: number, month: number) => {
  const { data: monthlyRevenue, isLoading: isLoadingMonthlyRevenue } = useQuery(
    {
      queryKey: ["monthly-revenue", year, month],
      queryFn: () => dashboardService.getMonthlyRevenue(year, month),
    }
  );

  return {
    monthlyRevenue,
    isLoadingMonthlyRevenue,
  };
};
