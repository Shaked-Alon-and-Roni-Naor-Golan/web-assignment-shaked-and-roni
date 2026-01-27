import { Post } from "./post";
import { User } from "./user";

export type Comment = {
  _id: string;
  userId: User
  postId: Post;
  content: string;
};