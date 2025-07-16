import { MenstrualCycleEntity } from "../menstrualCycles/menstrualCycleTypes";
import { SymptomEntity } from "../symptoms/symptomTypes";

export interface CycleSymptomEntity {
  id: string;
  intensity?: number;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  menstrualCycle: MenstrualCycleEntity;
  symptom: SymptomEntity;
}
