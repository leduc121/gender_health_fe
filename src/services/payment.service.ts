import { apiClient } from "@/services/api";
import { API_ENDPOINTS } from "@/config/api";
import { PaymentListResponse, PaymentGetAllParams } from "@/types/payment";
import { Appointment } from "@/types/api.d"; // Import Appointment type

export const PaymentService = {
  getAll: async (params?: PaymentGetAllParams): Promise<PaymentListResponse> => {
    try {
      const response = await apiClient.get<PaymentListResponse>(API_ENDPOINTS.PAYMENTS.GET_ALL, { params });
      return response;
    } catch (error) {
      console.error("Error fetching payments:", error);
      throw error;
    }
  },

  getMyPayments: async (params?: PaymentGetAllParams): Promise<PaymentListResponse> => { // Added getMyPayments method
    try {
      const response = await apiClient.get<PaymentListResponse>(API_ENDPOINTS.PAYMENTS.GET_MY_PAYMENTS, { params });
      return response;
    } catch (error) {
      console.error("Error fetching my payments:", error);
      throw error;
    }
  },

  // Add other payment-related service methods here (e.g., getById, updateStatus)

  verifyPayment: async (orderCode: string, appointmentId: string): Promise<Appointment> => {
    try {
      const response = await apiClient.post<Appointment>(API_ENDPOINTS.PAYMENTS.VERIFY, { orderCode, appointmentId });
      return response;
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw error;
    }
  },
};
