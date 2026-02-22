import { PostComment } from "./comment";
import { User } from "./user";

export interface Post {
  _id: string;
  owner: User;
  photoSrc: string;
  content: string;
  likedBy: User[];
  comments: PostComment[];
}

export interface CreatePostPayload {
  owner: string;
  content: string;
  photo?: File | null;
}

export interface UpdatePostPayload {
  content?: string;
  photo?: File | null;
  likedBy?: User[];
}
