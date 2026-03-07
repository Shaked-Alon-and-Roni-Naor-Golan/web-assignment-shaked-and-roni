import { User } from "./user";

export interface PostComment {
  id?: string;
  content: string;
  user: User;
}
