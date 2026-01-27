import mongoose from "mongoose";
import { RefreshToken } from "../dtos/RefreshToken";

const refreshTokenSchema = new mongoose.Schema<RefreshToken>({
  token: {
    type: String,
    required: true,
  },
});

export const RefreshTokenModel = mongoose.model<RefreshToken>(
  "refreshToken",
  refreshTokenSchema
);
 