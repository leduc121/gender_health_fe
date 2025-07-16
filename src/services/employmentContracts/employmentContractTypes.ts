import { ContractStatusType } from "@/types/apiEnumTypes";
import { ContractFileEntity } from "../contractFiles/contractFileTypes";
import { UserEntity } from "../users/userTypes";

export interface EmploymentContractEntity {
  id: string;
  contractNumber: string;
  contractType: string;
  startDate: Date | string;
  endDate?: Date | string;
  status: ContractStatusType;
  description?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  user: UserEntity;
  contractFiles: ContractFileEntity[];
}
