import { MenstrualCycleEntity } from "../menstrualCycles/menstrualCycleTypes";
import { MoodEntity } from "../moods/moodTypes";

export interface CycleMoodEntity {
  id: string;
  intensity?: number;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
  menstrualCycle: MenstrualCycleEntity;
  mood: MoodEntity;
}
