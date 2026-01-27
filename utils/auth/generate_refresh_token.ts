import jwt from "jsonwebtoken";
import { User } from "../../src/dtos/user";

export const generateRefreshToken = (
  user: Pick<User, "_id">,
  refreshTokenSecret: string,
  expiryTime: string
) => {
  const refreshToken = jwt.sign(user, refreshTokenSecret, {
    expiresIn: expiryTime,
  });

  return refreshToken;
};