import { SubscriptionStatusType } from "@/types/apiEnumTypes";
import { PackageServiceUsageEntity } from "../packageServiceUsages/packageServiceUsageTypes";
import { PaymentEntity } from "../payments/paymentTypes";
import { ServicePackageEntity } from "../servicePackages/servicePackageTypes";
import { UserEntity } from "../users/userTypes";

export interface UserPackageSubscriptionEntity {
  id: string;
  startDate: string | Date;
  endDate: string | Date;
  status: SubscriptionStatusType;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  user: UserEntity;
  servicePackage: ServicePackageEntity;
  payment: PaymentEntity;
  serviceUsages: PackageServiceUsageEntity[];
}
