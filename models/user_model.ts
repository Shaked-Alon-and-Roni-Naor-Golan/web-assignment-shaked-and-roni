import mongoose from "mongoose";
import { User } from "../dtos/user";

const usersSchema = new mongoose.Schema<User>({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
});

export const UserModel = mongoose.model<User>("users", usersSchema);
