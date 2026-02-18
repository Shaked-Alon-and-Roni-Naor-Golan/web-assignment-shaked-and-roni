import { User } from "./user";

export type Post = {
  _id: string;
  title: string;
  owner: User;
  content: User;
};
