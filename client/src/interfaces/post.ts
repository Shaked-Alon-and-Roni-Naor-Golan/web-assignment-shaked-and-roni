import { PostComment } from "./comment";
import { User } from "./user";

export interface Post {
  _id: string;
  owner: User;
  photoSrc: string;
  content: string;
  likedBy: User[];
  rating: number;
  comments: PostComment[];
}

export interface CreatePostPayload {
  owner: string;
  content: string;
  rating: number;
  photo?: File | null;
}

export interface UpdatePostPayload {
  content?: string;
  photo?: File | null;
  rating?: number;
  likedBy?: User[];
}
