import { PackageServiceEntity } from "../packageServices/packageServiceTypes";
import { PaymentEntity } from "../payments/paymentTypes";
import { UserPackageSubscriptionEntity } from "../subscriptions/subscriptionTypes";

export interface ServicePackageEntity {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  durationMonths: number;
  isActive: boolean;
  maxServicesPerMonth?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  packageServices: PackageServiceEntity[];
  subscriptions: UserPackageSubscriptionEntity[];
  payments: PaymentEntity[];
}
