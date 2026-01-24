import { Comment } from "../dtos/comment";
import mongoose from "mongoose";

const commentsSchema = new mongoose.Schema<Comment>({
  userId: {
    type: String, //TODO: change to User type
    required: true,
  },
  postId: {
    type: mongoose.Types.ObjectId,
    ref: "posts",
    required: true,
  },
  content: String,
});

export const CommentModel = mongoose.model<Comment>("comments", commentsSchema);