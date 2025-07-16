import { AppointmentEntity } from "../appointments/appointmentTypes";
import { ImageEntity } from "../images/imageTypes";
import { ServiceEntity } from "../services/serviceTypes";
import { UserEntity } from "../users/userTypes";

export interface FeedbackEntity {
  id: string;
  rating: number;
  comment?: string;
  isAnonymous: boolean;
  isPublic: boolean;
  staffResponse?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  user: UserEntity;
  service?: ServiceEntity;
  appointment?: AppointmentEntity;
  consultant?: UserEntity;
  images: ImageEntity[];
}
