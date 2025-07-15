export enum GenderType {
  MALE = "M",
  FEMALE = "F",
}

export enum RolesNameEnum {
  CUSTOMER = "customer",
  CONSULTANT = "consultant",
  STAFF = "staff",
  MANAGER = "manager",
  ADMIN = "admin",
}

export enum AppointmentStatusType {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CHECKED_IN = "checked_in",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  RESCHEDULED = "rescheduled",
  NO_SHOW = "no_show",
}

export enum ContentStatusType {
  DRAFT = "draft",
  PENDING_REVIEW = "pending_review",
  NEEDS_REVISION = "needs_revision",
  REJECTED = "rejected",
  APPROVED = "approved",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

export enum ContractStatusType {
  PENDING = "pending",
  ACTIVE = "active",
  EXPIRED = "expired",
  TERMINATED = "terminated",
  RENEWED = "renewed",
}

export enum LocationTypeEnum {
  ONLINE = "online",
  OFFICE = "office",
}

export enum PaymentStatusType {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
  CANCELLED = "cancelled",
}

export enum PriorityType {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

export enum ProfileStatusType {
  ACTIVE = "active",
  ON_LEAVE = "on_leave",
  TRAINING = "training",
  INACTIVE = "inactive",
  PENDING_APPROVAL = "pending_approval",
  REJECTED = "rejected",
}

export enum QuestionStatusType {
  PENDING = "pending",
  ANSWERED = "answered",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

export enum ReminderFrequencyType {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
}

export enum ReminderStatusType {
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
}

export enum ServiceCategoryType {
  CONSULTATION = "consultation",
  TEST = "test",
  TREATMENT = "treatment",
  PACKAGE = "package",
}

export enum SubscriptionStatusType {
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  SUSPENDED = "suspended",
}

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  FILE = "file",
  PUBLIC_PDF = "public_pdf",
}

export enum ConsultantSelectionType {
  MANUAL = "manual",
  AUTOMATIC = "automatic",
  SERVICE_BOOKING = "service_booking",
}
