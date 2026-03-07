import mongoose from "mongoose";
import { Comment } from "../dtos/comment";

const commentsSchema = new mongoose.Schema<Comment>({
  user: {
    type: mongoose.Types.ObjectId,
    ref: "users",
    required: true,
  },
  content: String,
});

export const CommentModel = mongoose.model<Comment>("comments", commentsSchema);
