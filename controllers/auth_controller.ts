import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../dtos/user";
import { Request, RequestHandler, Response } from "express";
import { UserModel } from "../models/user_model";
import { createNewUser, findUserById } from "../services/user_service";
import { generateAccessToken } from "../utils/auth/generate_access_token";
import { generateRefreshToken } from "../utils/auth/generate_refresh_token";
import { userToTokenData } from "../utils/auth/user_to_token_data";

export const register = async (req: Request, res: Response) => {
  const user: User = req.body;
  try {
    const currentUser = await UserModel.findOne({ email: user.email });

    if (currentUser) {
      throw Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(
      user.password,
      await bcrypt.genSalt()
    );
    await createNewUser({ ...user, password: hashedPassword });

    res.send("User completed registration");
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email });
    if (user == null) {
      throw Error("Invalid Credentials");
    }

    const doesPasswordsMatch = await bcrypt.compare(password, user.password);
    if (!doesPasswordsMatch) {
      throw Error("Invalid Credentials");
    }

    const accessToken = generateAccessToken(
      userToTokenData(user),
      process.env.ACCESS_TOKEN_SECRET,
      process.env.ACCESS_TOKEN_EXPIRATION
    );

    const refreshToken = generateRefreshToken(
      userToTokenData(user),
      process.env.REFRESH_TOKEN_SECRET,
      process.env.REFRESH_TOKEN_EXPIRATION
    );

    user.refreshTokens = user.refreshTokens
      ? [...user.refreshTokens, refreshToken]
      : [refreshToken];
    await user.save();

    res.send({ accessToken, refreshToken });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const getToken = (authorizationHeader: string) => {
  return authorizationHeader?.split(" ")?.[1];
};

export const logout: RequestHandler = (req, res) => {
  const refreshToken = getToken(req.headers.authorization as string);

  if (!refreshToken) {
    res.status(401).send("Refresh token is not provided");
    return;
  }

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET as string,
    async (err, userInfo: any) => {
      if (err) {
        res.status(403).send("Unauthorized");
        return;
      }

      try {
        const user = await findUserById(userInfo._id);
        if (!user) {
          res.status(403).send("Unauthorized");
          return;
        }

        if (!user.refreshTokens.includes(refreshToken)) {
          user.refreshTokens = [];
          await user.save();
          res.status(403).send("Unauthorized");
          return;
        }

        user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
        await user.save();
        res.send("Logged out");
      } catch (e: any) {
        res.status(403).send(e.message);
      }
    }
  );
};

export const refreshToken: RequestHandler = async (req, res) => {
  const token = getToken(req.headers.authorization as string);

  if (!token) {
    res.status(401).send("Unauthorized");
    return;
  }

  jwt.verify(
    token,
    process.env.REFRESH_TOKEN_SECRET as string,
    async (err, userInfo: any) => {
      if (err) {
        res.status(403).send("Unauthorized");
        return;
      }

      try {
        const user = await UserModel.findById(userInfo._id);
        if (!user) {
          res.status(403).send("Unauthorized");
          return;
        }

        if (!user.refreshTokens.includes(token)) {
          user.refreshTokens = [];
          await user.save();
          res.status(403).send("Unauthorized");
          return;
        }

        const newAccessToken = generateAccessToken(
          userToTokenData(user),
          process.env.ACCESS_TOKEN_SECRET as string,
          process.env.ACCESS_TOKEN_EXPIRATION as string
        );

        const newRefreshToken = generateRefreshToken(
          userToTokenData(user),
          process.env.REFRESH_TOKEN_SECRET as string,
          process.env.REFRESH_TOKEN_EXPIRATION as string
        );

        user.refreshTokens[user.refreshTokens.indexOf(token)] = newRefreshToken;
        await user.save();

        res.send({ accessToken: newAccessToken, refreshToken: newRefreshToken });
      } catch (e: any) {
        res.status(403).send(e.message);
      }
    }
  );
};
