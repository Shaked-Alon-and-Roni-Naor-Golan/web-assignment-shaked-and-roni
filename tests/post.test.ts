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

describe("Posts", () => {
  test("Get All Posts", async () => {
    const res = await request(await appPromise)
      .get("/posts")
      .set(headers);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("Get All Posts filtered by sender", async () => {
    const res = await request(await appPromise)
      .get(`/posts?postSender=${user._id}`)
      .set(headers);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test("Get All Posts returns 500 on DB error", async () => {
    jest.spyOn(postsModel.PostModel, "find").mockImplementationOnce(() => {
      throw new Error("DB error");
    });

    const res = await request(await appPromise)
      .get("/posts")
      .set(headers);

    expect(res.statusCode).toBe(500);
  });

  test("Get Post By ID", async () => {
    const res = await request(await appPromise)
      .get(`/posts/${post._id}`)
      .set(headers);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(post._id);
  });

  test("Get non-existing post returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(await appPromise)
      .get(`/posts/${fakeId}`)
      .set(headers);

    expect(res.statusCode).toBe(404);
  });

  test("Get post with invalid id returns 500", async () => {
    const res = await request(await appPromise)
      .get("/posts/invalid-id")
      .set(headers);

    expect(res.statusCode).toBe(500);
  });

  test("Create Post", async () => {
    const res = await request(await appPromise)
      .post("/posts")
      .set(headers)
      .send({
        title: "Test Post",
        sender: user._id,
        content: "This is a test",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("Test Post");
  });

  test("Create Post returns 500 on DB error", async () => {
    jest.spyOn(postsModel.PostModel, "create").mockImplementationOnce(() => {
      throw new Error("DB error");
    });

    const res = await request(await appPromise)
      .post("/posts")
      .set(headers)
      .send({
        title: "Error Post",
        sender: user._id,
        content: "x",
      });

    expect(res.statusCode).toBe(500);
  });

  test("Update Post", async () => {
    const res = await request(await appPromise)
      .put(`/posts/${post._id}`)
      .set(headers)
      .send({ content: "Updated content" });

    expect(res.statusCode).toBe(201);
  });

  test("Update non-existing post returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(await appPromise)
      .put(`/posts/${fakeId}`)
      .set(headers)
      .send({ content: "x" });

    expect(res.statusCode).toBe(404);
  });

  test("Update post with invalid id returns 500", async () => {
    const res = await request(await appPromise)
      .put("/posts/invalid-id")
      .set(headers)
      .send({ content: "x" });

    expect(res.statusCode).toBe(500);
  });
});