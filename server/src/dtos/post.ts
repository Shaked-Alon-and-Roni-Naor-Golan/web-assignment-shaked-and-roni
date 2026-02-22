import { User } from "./user";
import { Comment } from "./comment";

export type Post = {
  _id: string;
  owner: User;
  content: string;
  photoSrc: string;
  createdAt: Date;
  likedBy: User[];
  comments: Comment[];
};
