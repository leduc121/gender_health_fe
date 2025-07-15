import { LocationTypeEnum } from "@/types/apiEnumTypes";
import { AppointmentEntity } from "../appointments/appointmentTypes";
import { BlogEntity } from "../blogs/blogTypes";
import { CategoryEntity } from "../categories/categoryTypes";
import { FeedbackEntity } from "../feedbacks/feedbackTypes";
import { ImageEntity } from "../images/imageTypes";
import { PackageServiceEntity } from "../packageServices/packageServiceTypes";
import { PackageServiceUsageEntity } from "../packageServiceUsages/packageServiceUsageTypes";

export interface ServiceEntity {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  duration: number;
  isActive: boolean;
  shortDescription?: string;
  prerequisites?: string;
  postInstructions?: string;
  featured: boolean;
  specialties?: string[];
  location: LocationTypeEnum;
  requiresConsultant: boolean;
  version: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  category: CategoryEntity;
  feedbacks: FeedbackEntity[];
  packageServices: PackageServiceEntity[];
  packageServiceUsages: PackageServiceUsageEntity[];
  appointments: AppointmentEntity[];
  blogs: BlogEntity[];
  images: ImageEntity[];
}
