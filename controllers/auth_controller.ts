import { UserModel } from "../models/user_model";
import { Request, Response } from "express";
import { User } from "../dtos/user";
import { createNewUser } from "../services/user_service";
import { generateAccessToken } from "../utils/auth/generate_access_token";
import { generateRefreshToken } from "../utils/auth/generate_refresh_token";
import {
  createRefreshToken,
  deleteRefreshToken,
} from "../services/refresh_token_service";
const dotenv = require("dotenv");
dotenv.config();

let refreshTokens: string[] = [];

export const register = async (req: Request, res: Response) => {
  const user: User = req.body;
  try {
    const userExistsCheck = await UserModel.findOne({ email: user.email });
    if (userExistsCheck) {
      throw Error("User already exists");
    }

    await createNewUser(user);

    res.status(201).send("User registered successfully");
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email, password });

    if (!user) {
      throw Error("Invalid Cardentials");
    }

    const accessToken = generateAccessToken(
      convertUserToPlain(user),
      process.env.ACCESS_TOKEN_SECRET,
      "5m"
    );
    const refreshToken = generateRefreshToken(
      convertUserToPlain(user),
      process.env.REFRESH_TOKEN_SECRET,
      "1d"
    );

    await createRefreshToken(refreshToken);

    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true });
    res.status(200).send(accessToken);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) throw Error("No refresh token provided");

  await deleteRefreshToken(refreshToken);

  res.clearCookie("refreshToken");
  res.status(200).send("Logged out successfully");
};

const convertUserToPlain = (user: User): Pick<User, "_id"> => {
  return {
    _id: user._id.toString(),
  };
};