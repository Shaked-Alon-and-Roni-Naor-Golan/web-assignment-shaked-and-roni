import { Comment } from "../../server/dtos/comment";
import mongoose from "mongoose";

const commentsSchema = new mongoose.Schema<Comment>({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "users",
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