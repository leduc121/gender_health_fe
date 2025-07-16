import { MessageType, QuestionStatusType } from "@/types/apiEnumTypes";
import { AppointmentEntity } from "../appointments/appointmentTypes";
import { UserEntity } from "../users/userTypes";

export interface MessageEntity {
  id: string;
  content: string;
  type: MessageType;
  isRead: boolean;
  readAt?: string | Date;
  metadata?: {
    fileId?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    thumbnailUrl?: string;
    editedAt?: string;
    editCount?: number;
    replyTo?: string;
    mentions?: string[];
  };
  isEdited: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  question: QuestionEntity;
  sender?: UserEntity;
}

export interface QuestionEntity {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: QuestionStatusType;
  isAnonymous: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  user: UserEntity;
  messages: MessageEntity[];
  appointment?: AppointmentEntity;
}
