import mongoose from "mongoose";
import { Post } from "../dtos/post";

const postSchema = new mongoose.Schema<Post>({
  owner: {
    type: mongoose.Types.ObjectId,
    ref: "users",
    required: true,
  },
  content: String,
  photoSrc: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likedBy: {
    type: [mongoose.Types.ObjectId],
    ref: "users",
    default: [],
  },
  comments: {
    type: [mongoose.Types.ObjectId],
    ref: "comments",
    default: [],
  },
});

export const PostModel = mongoose.model<Post>("posts", postSchema);
