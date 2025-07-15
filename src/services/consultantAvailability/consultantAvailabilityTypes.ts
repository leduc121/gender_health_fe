import { LocationTypeEnum } from "@/types/apiEnumTypes";
import { AppointmentEntity } from "../appointments/appointmentTypes";
import { ConsultantProfileEntity } from "../consultantProfiles/consultantProfileTypes";

export interface ConsultantAvailabilityEntity {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  maxAppointments: number;
  location?: LocationTypeEnum;
  recurring: boolean;
  specificDate?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  consultantProfile: ConsultantProfileEntity;
  appointments: AppointmentEntity[];
}
