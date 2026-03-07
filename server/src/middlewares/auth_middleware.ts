import jwt from "jsonwebtoken";
import { NextFunction, Response } from "express";

const ALLOWED_PATHS = ["auth"];

export const authenticateToken = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  if (ALLOWED_PATHS.some((path) => req.path.includes(path))) {
    return next();
  } else {
    const authBearer = req.headers["authorization"];
    const accessToken = authBearer && authBearer.split(" ")[1];

    if (!accessToken) {
      return res.status(401).send("No token provided");
    }

    jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET,
      async (err, user) => {
        if (err) {
          res.status(403).send("Unauthorized");
        } else {
          req.user = user;
          next();
        }
      }
    );
  }
};
