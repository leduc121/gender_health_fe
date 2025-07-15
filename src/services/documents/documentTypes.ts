import { ConsultantProfileEntity } from "../consultantProfiles/consultantProfileTypes";
import { ContractFileEntity } from "../contractFiles/contractFileTypes";
import { TestResultEntity } from "../testResults/testResultTypes";
import { UserEntity } from "../users/userTypes";

export interface DocumentEntity {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  description?: string;
  documentType?: string;
  entityType?: string;
  entityId?: string;
  isSensitive: boolean;
  hash?: string;
  metadata?: {
    s3Key?: string;
    uploadedAt?: string;
    lastAccessed?: string;
    downloadCount?: number;
    bucketType?: string;
    cloudFrontUrl?: string;
    isPublic?: boolean;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string;
  testResult: TestResultEntity;
  user: UserEntity;
  contractFiles: ContractFileEntity[];
  consultantProfile: ConsultantProfileEntity;
}
