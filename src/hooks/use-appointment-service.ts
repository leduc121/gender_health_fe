import { AppointmentService } from "@/services/appointment.service";
import { useQuery } from "@tanstack/react-query";

export const useGetAppointmentById = (id: string) => {
  const {
    data: appointmentDetail,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["appointments", id],
    queryFn: () => AppointmentService.getAppointmentById(id),
  });

  return {
    appointmentDetail,
    isLoading,
    error,
  };
};
