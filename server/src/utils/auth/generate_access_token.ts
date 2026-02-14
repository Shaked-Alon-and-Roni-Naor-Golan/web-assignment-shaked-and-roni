import jwt from "jsonwebtoken";
// import { User } from "../../server/src/dtos/user";
import { JwtInfo } from "./auth";

export const generateAccessToken = (
  user: JwtInfo,
  accessToken: string,
  expiryTime: string
) => {
  return jwt.sign(user, accessToken, { expiresIn: expiryTime });
};