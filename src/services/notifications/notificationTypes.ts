import { PriorityType } from "@/types/apiEnumTypes";
import { UserEntity } from "../users/userTypes";

export interface NotificationEntity {
  id: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  readAt?: string | Date;
  actionUrl?: string;
  priority?: PriorityType;
  createdAt: string | Date;
  updatedAt: string | Date;
  user: UserEntity;
}
