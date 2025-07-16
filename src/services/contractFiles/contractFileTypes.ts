import { DocumentEntity } from "../documents/documentTypes";
import { EmploymentContractEntity } from "../employmentContracts/employmentContractTypes";

export interface ContractFileEntity {
  id: string;
  fileType?: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  contract: EmploymentContractEntity;
  file: DocumentEntity;
}
