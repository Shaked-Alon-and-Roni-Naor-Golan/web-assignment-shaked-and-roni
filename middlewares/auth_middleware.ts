import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User } from "../dtos/user";
import { generateAccessToken } from "../utils/auth/generate_access_token";
const dotenv = require("dotenv");
dotenv.config();

const ALLOWED_PATHS = ["auth"];

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (ALLOWED_PATHS.some((path) => req.path.includes(path))) {
    return next();
  } else {
    const authBearer = req.headers["authorization"];
    const accessToken = authBearer && authBearer.split(" ")[1];
    const refreshToken = req?.cookies?.refreshToken;

    if (!accessToken && !refreshToken) {
      return res.status(401).send("No tokens provided");
    }

    jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET,
      async (err, user) => {
        console.log(user);
        if (!err) {
          //@ts-ignore
          req.user = user;
          return next();
        }

        if (err.name === "TokenExpiredError" && refreshToken) {
          try {
            const refreshedUser: Pick<User, "_id"> = jwt.verify(
              refreshToken,
              process.env.REFRESH_TOKEN_SECRET
            ) as Pick<User, "_id">;

            if (!refreshedUser) {
              return res.status(403).json({ message: "Invalid refresh token" });
            }

            const newAccessToken = generateAccessToken(
              refreshedUser,
              process.env.ACCESS_TOKEN_SECRET,
              "5m"
            );
            res.setHeader("Authorization", `Bearer ${newAccessToken}`);
            //@ts-ignore
            req.user = refreshedUser;
            return next();
          } catch (refreshError) {
            return res
              .status(403)
              .json({ message: "Refresh token invalid or expired" });
          }
        }

        return res
          .status(403)
          .json({ message: "Access token invalid or expired" });
      }
    );
  }
};