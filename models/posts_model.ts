import mongoose from "mongoose";
import { Post } from "../dtos/post";

const postSchema = new mongoose.Schema<Post>({
  title: {
    type: String,
    required: true,
  },
  sender: {
    type: String, // TODO: change to User type
    required: true,
  },
  content: String,
});

export const PostModel = mongoose.model<Post>("posts", postSchema);