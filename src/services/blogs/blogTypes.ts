import { ContentStatusType } from "@/types/apiEnumTypes";
import { CategoryEntity } from "../categories/categoryTypes";
import { ImageEntity } from "../images/imageTypes";
import { ServiceEntity } from "../services/serviceTypes";
import { TagEntity } from "../tags/tagTypes";
import { UserEntity } from "../users/userTypes";

export interface BlogEntity {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: ContentStatusType;
  featuredImage?: string;
  views: number;
  seoTitle?: string;
  seoDescription?: string;
  excerpt?: string;
  reviewDate?: string | Date;
  rejectionReason?: string;
  revisionNotes?: string;
  publishNotes?: string;
  publishedAt?: string | Date;
  autoPublish: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  author: UserEntity;
  category?: CategoryEntity;
  reviewedByUser?: UserEntity;
  publishedByUser?: UserEntity;
  services: ServiceEntity[];
  images: ImageEntity[];
  tags: TagEntity[];
}
