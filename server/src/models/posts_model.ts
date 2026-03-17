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
  city: {
    type: String,
    trim: true,
    lowercase: true,
  },
  pricePerNight: {
    type: Number,
  },
  nights: {
    type: Number,
  },
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

postSchema.index({ city: 1 });
postSchema.index({ pricePerNight: 1 });
postSchema.index({ nights: 1 });

export const PostModel = mongoose.model<Post>("posts", postSchema);
