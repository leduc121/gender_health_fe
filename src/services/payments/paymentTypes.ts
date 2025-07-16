import { PaymentStatusType } from "@/types/apiEnumTypes";
import {
  CheckoutResponseDataType,
  PaymentLinkDataType,
  WebhookDataType,
} from "@payos/node/lib/type";
import { AppointmentEntity } from "../appointments/appointmentTypes";
import { ServicePackageEntity } from "../servicePackages/servicePackageTypes";
import { ServiceEntity } from "../services/serviceTypes";
import { UserPackageSubscriptionEntity } from "../subscriptions/subscriptionTypes";
import { UserEntity } from "../users/userTypes";
import { PayOSPaymentStatus } from "./enums/payos.enum";

export type GatewayResponseType = Partial<CheckoutResponseDataType> & {
  frontendReturnUrl: string;
  frontendCancelUrl: string;
  payosStatus?: PayOSPaymentStatus;
  paymentConfirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledBy?: "USER" | "SYSTEM" | "WEBHOOK";
  paymentInfo?: PaymentLinkDataType;
  webhookData?: WebhookDataType;
  payosCancelResult?: PaymentLinkDataType | null;
};

export interface PaymentEntity {
  id: string;
  amount: number;
  paymentMethod: string;
  status: PaymentStatusType;
  paymentDate?: string | Date;
  gatewayResponse?: GatewayResponseType;
  refunded: boolean;
  refundAmount: number;
  refundReason?: string;
  invoiceNumber?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  user: UserEntity;
  appointment?: AppointmentEntity;
  servicePackage?: ServicePackageEntity;
  service?: ServiceEntity;
  packageSubscriptions: UserPackageSubscriptionEntity[];
}
