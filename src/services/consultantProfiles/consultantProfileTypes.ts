import { LocationTypeEnum, ProfileStatusType } from "@/types/apiEnumTypes";
import { ConsultantAvailabilityEntity } from "../consultantAvailability/consultantAvailabilityTypes";
import { UserEntity } from "../users/userTypes";

export interface ConsultantProfileEntity {
  id: string;
  specialties: string[];
  qualification: string;
  experience: string;
  bio?: string;
  workingHours?: WorkingHours;
  rating: number;
  isAvailable: boolean;
  profileStatus: ProfileStatusType;
  rejectionReason?: string;
  languages?: string[];
  educationBackground?: string;
  consultationFee: number;
  maxAppointmentsPerDay: number;
  isVerified: boolean;
  verifiedAt?: string | Date;
  consultationTypes: LocationTypeEnum[];
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  user: UserEntity;
  verifiedBy?: UserEntity;
  availabilities: ConsultantAvailabilityEntity[];
  documents: Document[];
}

/**
 * Giờ làm việc cho một ngày cụ thể
 */
export interface DayWorkingHours {
  startTime: string; // Format: "HH:mm" (e.g., "09:00")
  endTime: string; // Format: "HH:mm" (e.g., "17:00")
  isAvailable: boolean; // Có làm việc vào ngày này không
  maxAppointments?: number; // Số lượng appointments tối đa trong ngày
}

/**
 * Lịch làm việc hàng tuần
 */
export interface WorkingHours {
  monday?: DayWorkingHours[]; // Danh sách giờ làm việc cho thứ Hai
  tuesday?: DayWorkingHours[];
  wednesday?: DayWorkingHours[];
  thursday?: DayWorkingHours[];
  friday?: DayWorkingHours[];
  saturday?: DayWorkingHours[];
  sunday?: DayWorkingHours[];
  timezone?: string; // Timezone (e.g., "Asia/Ho_Chi_Minh")
  notes?: string; // Ghi chú thêm về lịch làm việc
}
