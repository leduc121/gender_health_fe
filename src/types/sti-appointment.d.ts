export interface CreateStiAppointmentDto {
  stiServiceId: string;
  consultantId?: string;
  sampleCollectionDate: string;
  sampleCollectionLocation: "online" | "office";
  notes?: string;
}

export interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentLocation: string;
  cancellationReason: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  consultant: {
    id: string;
    email: string;
    googleId: string | null;
    firstName: string;
    lastName: string;
  } | null;
  consultantSelectionType: string;
  createdAt: string;
  deletedAt: string | null;
  fixedPrice: string;
  meetingLink: string | null;
  notes: string | null;
  reminderSent: boolean;
  reminderSentAt: string | null;
  services: Array<{
    id: string;
    name: string;
  }>;
  status: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    gender: string;
    role: {
      id: string;
      name: string;
      description: string;
    };
  } | null;
}

export interface FindAvailableSlotsDto {
  serviceIds?: string[];
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  consultantId?: string;
}

export interface AvailableSlotDto {
  dateTime: string;
  consultant: any; // You might want to define a more specific type for consultant
  availabilityId: string;
  remainingSlots: number;
}

export interface FindAvailableSlotsResponseDto {
  availableSlots: AvailableSlotDto[];
  totalSlots: number;
  totalConsultants: number;
  message?: string;
}

export interface StiProcess {
  id: string;
  testCode: string;
  status:
    | "ordered"
    | "sample_collection_scheduled"
    | "sample_collected"
    | "processing"
    | "result_ready"
    | "result_delivered"
    | "consultation_required"
    | "follow_up_scheduled"
    | "completed"
    | "cancelled";
  sampleType: "blood" | "urine" | "swab" | "saliva" | "other";
  priority: "normal" | "high" | "urgent";
  estimatedResultDate: string | null;
  actualResultDate: string | null;
  sampleCollectionDate: string | null;
  sampleCollectionLocation: string | null;
  processNotes: string | null;
  labNotes: string | null;
  sampleCollectedBy: string | null;
  labProcessedBy: string | null;
  requiresConsultation: boolean;
  patientNotified: boolean;
  resultEmailSent: boolean;
  isConfidential: boolean;
  createdAt: string;
  updatedAt: string;
  patient: User | null; // Use the User interface
  service: {
    id: string;
    name: string;
    // Add other service details if available from swagger if needed
  } | null;
  appointment: {
    id: string;
    appointmentDate: string;
    status: string; // Use a more specific type if available, e.g., AppointmentStatus
    notes: string | null;
    meetingLink: string | null;
    reminderSent: boolean;
    reminderSentAt: string | null;
    checkInTime: string | null;
    checkOutTime: string | null;
    fixedPrice: string;
    consultantSelectionType: string; // Use a more specific type if available
    appointmentLocation: string; // Use a more specific type if available, e.g., "online" | "office"
    cancellationReason: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    user: User | null; // Patient user
    cancelledBy: string | null; // User ID
    consultant: User | null; // Consultant user
    consultantAvailability: any | null; // Define a proper type if available
    question: any | null; // Define a proper type if available
  } | null;
  testResult: any | null; // Define a proper type for TestResult if available
  consultantDoctor: User | null; // Use the User interface
}

export interface UpdateStiProcessStatusDto {
  status:
    | "ordered"
    | "sample_collection_scheduled"
    | "sample_collected"
    | "processing"
    | "result_ready"
    | "result_delivered"
    | "consultation_required"
    | "follow_up_scheduled"
    | "completed"
    | "cancelled";
}
