import { Post } from "./post";
import { User } from "./user";

export type Comment = {
  _id: string;
  user: User;
  post: Post;
  content: string;
};
