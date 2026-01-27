import jwt from "jsonwebtoken";
import { User } from "../../src/dtos/user";

export const generateAccessToken = (
  user: Pick<User, "_id">,
  accessToken: string,
  expiryTime: string
) => {
  return jwt.sign(user, accessToken, { expiresIn: expiryTime });
};