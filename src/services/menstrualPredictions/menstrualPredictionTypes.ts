import { UserEntity } from "../users/userTypes";

export interface MenstrualPredictionEntity {
  id: string;
  predictedCycleStart: string | Date;
  predictedCycleEnd: string | Date;
  predictedFertileStart: string | Date;
  predictedFertileEnd: string | Date;
  predictedOvulationDate: string | Date;
  predictionAccuracy?: number;
  notificationSent: boolean;
  notificationSentAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  user: UserEntity;
}
