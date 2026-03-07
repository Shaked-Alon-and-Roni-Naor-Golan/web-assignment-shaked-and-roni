import { User } from "./user";

export type Comment = {
  _id: string;
  user: User;
  content: string;
};
