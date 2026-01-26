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
import { CommentModel } from "../models/comments_model";
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
  await CommentModel.deleteMany({});
});

afterAll(async () => {
  await CommentModel.deleteMany({});
  await PostModel.deleteMany({ sender: post._id });
  await UserModel.deleteMany({ email: user.email });
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

    const c = res.body[0];
    expect(c.content).toBe("comment content");
    expect(c.userId._id.toString()).toBe(user._id);
    expect(c.postId._id.toString()).toBe(post._id);
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
    expect(res.body[0].userId._id.toString()).toBe(user._id);
  });

  test("Get All Comments when empty", async () => {
    const res = await request(await appPromise)
      .get("/comments")
      .set(headers);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
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
    expect(res.body.content).toBe("comment content");
    expect(res.body.userId._id.toString()).toBe(user._id);
    expect(res.body.postId._id.toString()).toBe(post._id);
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
    expect(res.body.length).toBe(1);
  });

  test("Get Comment by Post ID when no comments returns 404", async () => {
    const fakePostId = new mongoose.Types.ObjectId();

    const res = await request(await appPromise)
      .get(`/comments/post/${fakePostId}`)
      .set(headers);

    expect(res.statusCode).toBe(404);
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

    const commentDB = await CommentModel.findById(res.body._id);
    expect(commentDB).not.toBeNull();
  });

  test("Create Comment with invalid body returns 500", async () => {
    const res = await request(await appPromise)
      .post("/comments")
      .set(headers)
      .send({
        postId: post._id,
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
      .send({ content: "updated content" });

    expect(res.statusCode).toBe(201);

    const updated = await CommentModel.findById(comment._id);
    expect(updated.content).toBe("updated content");
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

    const deleted = await CommentModel.findById(comment._id);
    expect(deleted).toBeNull();
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
