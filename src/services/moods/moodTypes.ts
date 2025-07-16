import { CycleMoodEntity } from "../cycleMoods/cycleMoodTypes";

export interface MoodEntity {
  id: string;
  name: string;
  description?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  cycleMoods: CycleMoodEntity[];
}
