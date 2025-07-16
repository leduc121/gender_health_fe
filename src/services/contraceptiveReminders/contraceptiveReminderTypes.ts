import {
  ReminderFrequencyType,
  ReminderStatusType,
} from "@/types/apiEnumTypes";
import { UserEntity } from "../users/userTypes";

export interface ContraceptiveReminderEntity {
  id: string;
  contraceptiveType: string;
  reminderTime: string;
  startDate: string | Date;
  endDate?: string | Date;
  frequency: ReminderFrequencyType;
  status: ReminderStatusType;
  daysOfWeek?: number[];
  reminderMessage?: string;
  snoozeCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  user: UserEntity;
}
