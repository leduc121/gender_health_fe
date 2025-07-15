import { RolesNameEnum } from "@/types/apiEnumTypes";
import { UserEntity } from "../users/userTypes";

export interface RoleEntity {
  id: string;
  name: RolesNameEnum;
  description?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  users: UserEntity[];
}
