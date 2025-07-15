import { BlogEntity } from "../blogs/blogTypes";

export interface TagEntity {
  id: string;
  name: string;
  slug: string;
  blogs: BlogEntity[];
}
