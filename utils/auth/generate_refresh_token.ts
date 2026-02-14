import jwt from "jsonwebtoken";
import { User } from "../../server/dtos/user";

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