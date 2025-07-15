import { BlogEntity } from "../blogs/blogTypes";
import { ServiceEntity } from "../services/serviceTypes";
import { SymptomEntity } from "../symptoms/symptomTypes";

export interface CategoryEntity {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  children: CategoryEntity[];
  parent?: CategoryEntity;
  services: ServiceEntity[];
  blogs: BlogEntity[];
  symptoms: SymptomEntity[];
}
