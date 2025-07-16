import {
  AppointmentStatusType,
  ConsultantSelectionType,
  LocationTypeEnum,
  SortOrder,
} from "@/types/apiEnumTypes";
import { PaginationDto } from "@/types/commonTypes";
import { QuestionEntity } from "../chat/chatTypes";
import { ConsultantAvailabilityEntity } from "../consultantAvailability/consultantAvailabilityTypes";
import { FeedbackEntity } from "../feedbacks/feedbackTypes";
import { PaymentEntity } from "../payments/paymentTypes";
import { ServiceEntity } from "../services/serviceTypes";
import { StiTestProcessEntity } from "../stiTestProcesses/stiTestProcesseTypes";
import { TestResultEntity } from "../testResults/testResultTypes";
import { UserEntity } from "../users/userTypes";

export interface AppointmentEntity {
  id: string;
  appointmentDate: string | Date;
  status: AppointmentStatusType;
  notes?: string;
  meetingLink?: string;
  reminderSent: boolean;
  reminderSentAt?: string | Date;
  checkInTime?: string | Date;
  checkOutTime?: string | Date;
  fixedPrice: number;
  consultantSelectionType: ConsultantSelectionType;
  appointmentLocation: LocationTypeEnum;
  cancellationReason?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  user: UserEntity;
  cancelledBy?: UserEntity;
  consultant?: UserEntity;
  consultantAvailability?: ConsultantAvailabilityEntity;
  payments: PaymentEntity[];
  feedbacks: FeedbackEntity[];
  testResult: TestResultEntity;
  stiTestProcess: StiTestProcessEntity;
  services: ServiceEntity[];
  question?: QuestionEntity;
}

export interface AppointmentCreateDto {
  serviceIds: string[];
  consultantId: string;
  appointmentDate: string | Date;
  appointmentLocation: LocationTypeEnum;
  notes?: string;
  meetingLink?: string;
}

export type AppointmentQueryDto = {
  userId?: string;
  consultantId?: string;
  status?: AppointmentStatusType;
  fromDate?: string | Date;
  toDate?: string | Date;
  sortBy?: string;
  sortOrder?: SortOrder;
} & PaginationDto;

export interface FindAvailableSlotsDto {
  serviceIds: string[];
  startDate: string | Date;
  endDate?: string | Date;
  startTime?: string | Date;
  endTime?: string | Date;
  consultantId?: string;
}

export interface AvailableSlotDto {
  dateTime: string | Date;
  consultant: {
    id: string;
    name: string;
    specialization: string;
  };
  availabilityId: string;
  remainingSlots: number;
}
