import { ServicePackageEntity } from "../servicePackages/servicePackageTypes";
import { ServiceEntity } from "../services/serviceTypes";

export interface PackageServiceEntity {
  id: string;
  quantityLimit?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  servicePackage: ServicePackageEntity;
  service: ServiceEntity;
}
