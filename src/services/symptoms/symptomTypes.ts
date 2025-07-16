import { CategoryEntity } from "../categories/categoryTypes";
import { CycleSymptomEntity } from "../cycleSymptoms/cycleSymptomTypes";

export interface SymptomEntity {
  id: string;
  name: string;
  description?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  category: CategoryEntity;
  cycleSymptoms: CycleSymptomEntity[];
}
