import { AppointmentEntity } from "../appointments/appointmentTypes";
import { ServiceEntity } from "../services/serviceTypes";
import { TestResultEntity } from "../testResults/testResultTypes";
import { UserEntity } from "../users/userTypes";
import { ProcessPriority, StiSampleType, StiTestProcessStatus } from "./enums";

export interface StiTestProcessEntity {
  id: string;
  testCode: string;
  status: StiTestProcessStatus;
  sampleType: StiSampleType;
  priority: ProcessPriority;
  estimatedResultDate?: string | Date;
  actualResultDate?: string | Date;
  sampleCollectionDate?: string | Date;
  sampleCollectionLocation?: string;
  processNotes?: string;
  labNotes?: string;
  sampleCollectedBy?: string;
  labProcessedBy?: string;
  requiresConsultation: boolean;
  patientNotified: boolean;
  resultEmailSent: boolean;
  isConfidential: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  patient: UserEntity;
  appointment?: AppointmentEntity;
  testResult?: TestResultEntity;
  service: ServiceEntity;
  consultantDoctor?: UserEntity;
}
