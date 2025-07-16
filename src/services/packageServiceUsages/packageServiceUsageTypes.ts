import { ServiceEntity } from "../services/serviceTypes";
import { UserPackageSubscriptionEntity } from "../subscriptions/subscriptionTypes";

export interface PackageServiceUsageEntity {
  id: string;
  usageDate: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  subscription: UserPackageSubscriptionEntity;
  service: ServiceEntity;
}
