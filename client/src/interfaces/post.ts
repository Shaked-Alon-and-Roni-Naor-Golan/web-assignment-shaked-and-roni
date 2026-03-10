import { PostComment } from "./comment";
import { User } from "./user";

export interface Post {
  _id: string;
  owner: User;
  photoSrc: string;
  content: string;
  city?: string;
  pricePerNight?: number;
  nights?: number;
  likedBy: User[];
  comments: PostComment[];
}

export interface CreatePostPayload {
  owner: string;
  content: string;
  city?: string;
  pricePerNight?: number;
  nights?: number;
  photo?: File | null;
}

export interface UpdatePostPayload {
  content?: string;
  city?: string;
  pricePerNight?: number;
  nights?: number;
  photo?: File | null;
  likedBy?: User[];
  userId?: string;
}
