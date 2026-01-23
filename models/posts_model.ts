const mongoose = require("mongoose");
import { Post } from "../dtos/post";

const postSchema = new mongoose.Schema<Post>({
  title: {
    type: String,
    required: true,
  },
  sender: {
    type: mongoose.Types.ObjectId, // TODO: change to User type when User model is created - add ref to "users"
    required: true,
  },
  content: String,
});

export const PostModel = mongoose.model<Post>("posts", postSchema);