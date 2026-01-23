import { Post } from "./post";

export type Comment = {
  _id: string;
  userId: string; // TODO: change to User type
  postId: Post;
  content: string;
};