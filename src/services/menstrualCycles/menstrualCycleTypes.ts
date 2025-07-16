import { CycleMoodEntity } from "../cycleMoods/cycleMoodTypes";
import { CycleSymptomEntity } from "../cycleSymptoms/cycleSymptomTypes";
import { UserEntity } from "../users/userTypes";

export interface MenstrualCycleEntity {
  id: string;
  cycleStartDate: string;
  cycleEndDate?: string;
  cycleLength?: number;
  periodLength?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  user: UserEntity;
  cycleMoods: CycleMoodEntity[];
  cycleSymptoms: CycleSymptomEntity[];
}
