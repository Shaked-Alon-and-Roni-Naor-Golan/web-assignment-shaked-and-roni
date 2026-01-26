import appPromise from "../app";
import mongoose from "mongoose";
import request from "supertest";
import { generateAccessToken } from "../utils/auth/generate_access_token";
import {
  afterEach,
  afterAll,
  beforeAll,
  describe,
  expect,
  test,
} from "@jest/globals";
import { UserModel } from "../models/user_model";
import { PostModel } from "../models/posts_model";
import * as postsModel from "../models/posts_model";
import { userToTokenData } from "../utils/auth/user_to_token_data";

const user = {
  _id: new mongoose.Types.ObjectId().toString(),
  username: "auth",
  password: "auth",
  email: "auth@auth.auth",
};

const post = {
  _id: new mongoose.Types.ObjectId().toString(),
  title: "title",
  sender: user._id,
  content: "content",
};

const headers: { authorization: string } = { authorization: "" };

beforeAll(async () => {
  await appPromise;

  await UserModel.create(user);
  await PostModel.create(post);

  headers.authorization =
    "Bearer " +
    generateAccessToken(
      userToTokenData(await UserModel.findOne({ email: user.email })),
      process.env.ACCESS_TOKEN_SECRET,
      process.env.ACCESS_TOKEN_EXPIRATION
    );
});

afterEach(async () => {
  jest.restoreAllMocks();
  await PostModel.deleteMany({ title: /test/i });
});

afterAll(async () => {
  await PostModel.deleteMany({ sender: user._id });
  await UserModel.deleteMany({ email: user.email });
  await mongoose.connection.close();
});