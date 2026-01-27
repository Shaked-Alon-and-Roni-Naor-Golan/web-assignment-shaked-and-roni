import appPromise from "../src/app";
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
import { UserModel } from "../src/models/user_model";
import { PostModel } from "../src/models/posts_model";
import { CommentModel } from "../src/models/comments_model";
import * as commentsModel from "../src/models/comments_model";
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
  await CommentModel.deleteMany({});
});

afterAll(async () => {
await CommentModel.deleteMany({});
  await PostModel.deleteMany({});
  await UserModel.deleteMany({});
  await mongoose.connection.close();
});

describe("Comments", () => {
  test("Get All Comments", async () => {
    await CommentModel.create({
      userId: user._id,
      postId: post._id,
      content: "comment content",
    });

    const res = await request(await appPromise)
      .get("/comments")
      .set(headers);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

  test("Get All Comments filtered by userId", async () => {
    await CommentModel.create({
      userId: user._id,
      postId: post._id,
      content: "user comment",
    });

    const res = await request(await appPromise)
      .get(`/comments?userId=${user._id}`)
      .set(headers);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

  test("Get All Comments returns 500 on DB error", async () => {
    jest
      .spyOn(commentsModel.CommentModel, "find")
      .mockImplementationOnce(() => {
        throw new Error("DB error");
      });

    const res = await request(await appPromise)
      .get("/comments")
      .set(headers);

    expect(res.statusCode).toBe(500);
  });

  test("Get Comment By ID", async () => {
    const comment = await CommentModel.create({
      userId: user._id,
      postId: post._id,
      content: "comment content",
    });

    const res = await request(await appPromise)
      .get(`/comments/${comment._id}`)
      .set(headers);

    expect(res.statusCode).toBe(200);
  });

  test("Get non-existing comment returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(await appPromise)
      .get(`/comments/${fakeId}`)
      .set(headers);

    expect(res.statusCode).toBe(404);
  });

  test("Get comment with invalid id returns 500", async () => {
    const res = await request(await appPromise)
      .get("/comments/invalid-id")
      .set(headers);

    expect(res.statusCode).toBe(500);
  });

  test("Get Comment by Post ID", async () => {
    await CommentModel.create({
      userId: user._id,
      postId: post._id,
      content: "comment content",
    });

    const res = await request(await appPromise)
      .get(`/comments/post/${post._id}`)
      .set(headers);

    expect(res.statusCode).toBe(200);
  });

  test("Get Comment by Post ID returns 404 when empty", async () => {
    const fakePostId = new mongoose.Types.ObjectId();

    const res = await request(await appPromise)
      .get(`/comments/post/${fakePostId}`)
      .set(headers);

    expect(res.statusCode).toBe(404);
  });

  test("Get Comment by Post ID returns 500 on DB error", async () => {
    jest
      .spyOn(commentsModel.CommentModel, "find")
      .mockImplementationOnce(() => {
        throw new Error("DB error");
      });

    const res = await request(await appPromise)
      .get(`/comments/post/${post._id}`)
      .set(headers);

    expect(res.statusCode).toBe(500);
  });

  test("Create Comment", async () => {
    const res = await request(await appPromise)
      .post("/comments")
      .set(headers)
      .send({
        userId: user._id,
        postId: post._id,
        content: "new comment",
      });

    expect(res.statusCode).toBe(201);
  });

  test("Create Comment returns 500 on DB error", async () => {
    jest
      .spyOn(commentsModel.CommentModel, "create")
      .mockImplementationOnce(() => {
        throw new Error("DB error");
      });

    const res = await request(await appPromise)
      .post("/comments")
      .set(headers)
      .send({
        userId: user._id,
        postId: post._id,
        content: "x",
      });

    expect(res.statusCode).toBe(500);
  });

  test("Update Comment", async () => {
    const comment = await CommentModel.create({
      userId: user._id,
      postId: post._id,
      content: "original",
    });

    const res = await request(await appPromise)
      .put(`/comments/${comment._id}`)
      .set(headers)
      .send({ content: "updated" });

    expect(res.statusCode).toBe(201);
  });

  test("Update non-existing comment returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(await appPromise)
      .put(`/comments/${fakeId}`)
      .set(headers)
      .send({ content: "x" });

    expect(res.statusCode).toBe(404);
  });

  test("Update comment with invalid id returns 500", async () => {
    const res = await request(await appPromise)
      .put("/comments/invalid-id")
      .set(headers)
      .send({ content: "x" });

    expect(res.statusCode).toBe(500);
  });

  test("Delete Comment", async () => {
    const comment = await CommentModel.create({
      userId: user._id,
      postId: post._id,
      content: "to delete",
    });

    const res = await request(await appPromise)
      .delete(`/comments/${comment._id}`)
      .set(headers);

    expect(res.statusCode).toBe(200);
  });

  test("Delete non-existing comment returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(await appPromise)
      .delete(`/comments/${fakeId}`)
      .set(headers);

    expect(res.statusCode).toBe(404);
  });

  test("Delete comment with invalid id returns 500", async () => {
    const res = await request(await appPromise)
      .delete("/comments/invalid-id")
      .set(headers);

    expect(res.statusCode).toBe(500);
  });
});