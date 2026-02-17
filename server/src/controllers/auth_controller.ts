import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../dtos/user";
import { Request, Response } from "express";
import { deleteFile, uploadFile } from "../utils/multer";
import { UserModel } from "../models/user_model";
import { OAuth2Client } from "google-auth-library";
import { createNewUser } from "../services/user_service";
import { generateAndSaveTokens } from "../utils/auth/auth";

export const register = async (req: Request, res: Response) => {
  try {
    await uploadFile(req, res);

    const user: User = JSON.parse(req.body.user);
    user.photo = req.file?.filename;

    const usernameExistsCheck = await UserModel.findOne({
      username: user.username,
    });

    if (usernameExistsCheck) {
      req.file?.filename && deleteFile(req.file.filename);
      res.status(400).send({
        userExist: true,
        message: "User already exists, please login",
      });
      return;
    }

    const emailExistsCheck = await UserModel.findOne({
      email: user.email,
    });

    if (emailExistsCheck) {
      req.file?.filename && deleteFile(req.file.filename);

      res.status(400).send({
        userExist: true,
        message: "email already exists, please login",
      });
      return;
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(user.password, salt);
    await createNewUser({
      ...user,
      password: hashedPassword,
      photo: req.file?.filename,
    });

    req.body = { username: user.username, password: user.password };
    login(req, res);
  } catch (error) {
    req.file?.filename && deleteFile(req.file.filename);
    res.status(500).send(error.message);
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const user = await UserModel.findOne({ username });
    if (user == null) throw Error("Invalid Credentials");

    const passwordsMatch = await bcrypt.compare(password, user.password);
    if (!passwordsMatch) throw Error("Invalid Credentials");

    const { accessToken, refreshToken, userTokens } =
      await generateAndSaveTokens(user);

    user.tokens = userTokens;
    await user.save();

    res.status(200).send({
      accessToken,
      refreshToken,
      user,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

export const logout = (req: Request, res: Response) => {
  const refreshToken = req.headers.authorization?.split(" ")?.[1];
  if (!refreshToken) return res.status(401).send("No refresh token provided");

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, userInfo: User) => {
      if (err) return res.status(403).send("Unauthorized");
      const userId = userInfo._id;
      try {
        const user = await UserModel.findById(userId);
        if (user == null) return res.status(403).send("Unauthorized");
        if (!user.tokens.includes(refreshToken)) {
          user.tokens = [];
          await user.save();
          return res.status(403).send("Unauthorized");
        }
        user.tokens = user.tokens.filter((token) => token !== refreshToken);
        await user.save();
        res.status(200).send("Logged out successfully");
      } catch (err) {
        res.status(403).send(err.message);
      }
    }
  );
};

export const refreshToken = async (req: Request, res: Response) => {
  const authHeaders = req.headers.authorization;
  const token = authHeaders && authHeaders.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(
    token,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, userInfo: User) => {
      if (err) return res.status(403).send("Unauthorized");

      const userId = userInfo._id;
      try {
        const user = await UserModel.findById(userId);
        if (user == null) return res.status(403).send("Unauthorized");
        if (!user.tokens.includes(token)) {
          user.tokens = [];
          await user.save();
          return res.status(403).send("Unauthorized");
        }

        const { accessToken, refreshToken, userTokens } =
          await generateAndSaveTokens(user);

        user.tokens = userTokens;
        await user.save();

        res.status(200).send({
          accessToken,
          refreshToken,
          user,
        });
      } catch (err) {
        res.status(403).send(err.message);
      }
    }
  );
};

export const googleLogin = async (req: Request, res: Response) => {
  const client = new OAuth2Client();
  const GOOGLE_PASSWORD = "google-signin";

  const credential = req.body.credential;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    let user = await UserModel.findOne({ email: email });
    if (user == null) {
      user = await UserModel.create({
        email: email,
        username: email.split("@")[0],
        photo: payload?.picture,
        password: GOOGLE_PASSWORD,
      });
    }

    const { accessToken, refreshToken, userTokens } =
      await generateAndSaveTokens(user);

    user.tokens = userTokens;
    await user.save();

    res.status(200).send({
      accessToken,
      refreshToken,
      user,
    });
  } catch (err) {
    return res.status(500).send("failed to sign in google");
  }
};
