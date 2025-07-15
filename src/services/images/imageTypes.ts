import { BlogEntity } from "../blogs/blogTypes";
import { FeedbackEntity } from "../feedbacks/feedbackTypes";
import { ServiceEntity } from "../services/serviceTypes";
import { UserEntity } from "../users/userTypes";

export interface ImageEntity {
  id: string;
  name: string;
  originalName: string;
  size: number;
  width?: number;
  height?: number;
  format?: string;
  altText?: string;
  isPublic: boolean;
  url: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: UserEntity;
  blog?: BlogEntity;
  service?: ServiceEntity;
  feedback?: FeedbackEntity;
}
