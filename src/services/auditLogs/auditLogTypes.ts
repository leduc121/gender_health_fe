import { UserEntity } from "../users/userTypes";

export interface AuditLogEntity {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  userAgent?: string;
  details?: string;
  status: string;
  createdAt: Date | string;
  user: UserEntity;
}
