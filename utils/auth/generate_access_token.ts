import jwt from "jsonwebtoken";
import { User } from "../../server/dtos/user";

export const generateAccessToken = (
  user: Pick<User, "_id">,
  accessToken: string,
  expiryTime: string
) => {
  return jwt.sign(user, accessToken, { expiresIn: expiryTime });
};