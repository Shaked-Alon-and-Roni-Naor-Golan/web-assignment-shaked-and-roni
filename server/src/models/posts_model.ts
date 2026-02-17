import mongoose from "mongoose";
import { Post } from "../dtos/post";

const postSchema = new mongoose.Schema<Post>({
  title: {
    type: String,
    required: true,
  },
  owner: {
    type: mongoose.Types.ObjectId,
    ref: "users",
    required: false,
  },
  content: String,
});

export const PostModel = mongoose.model<Post>("posts", postSchema);
