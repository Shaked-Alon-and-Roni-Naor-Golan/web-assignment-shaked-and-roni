import jwt from "jsonwebtoken";
import { JwtInfo } from "./auth";

export const generateRefreshToken = (
  user: JwtInfo,
  refreshTokenSecret: string,
  expiryTime: string
) => {
  const refreshToken = jwt.sign(user, refreshTokenSecret, {
    expiresIn: expiryTime,
  });

  return refreshToken;
};
