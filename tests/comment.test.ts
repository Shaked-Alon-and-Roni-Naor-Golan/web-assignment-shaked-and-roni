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

afterAll(async () => {
  await CommentModel.deleteMany({});
  await PostModel.deleteMany({ sender: post._id });
  await UserModel.deleteMany({ email: user.email });

  await mongoose.connection.close();
});

afterEach(async () => {
  await CommentModel.deleteMany({});
});

describe("Comments", () => {
  test("Get All Comments", async () => {
    const comment = await CommentModel.create({
      userId: user._id,
      postId: post._id,
      content: "comment content",
    });

    const res = await request(await appPromise)
      .get("/comments")
      .set(headers);

    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(1);

    const c = res.body[0];
    expect(c.content).toEqual("comment content");
    expect(c.userId._id.toString()).toEqual(user._id);
    expect(c.postId._id.toString()).toEqual(post._id);
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

    expect(res.statusCode).toEqual(200);
    expect(res.body.content).toEqual("comment content");
    expect(res.body.userId._id.toString()).toEqual(user._id);
    expect(res.body.postId._id.toString()).toEqual(post._id);
  });

  test("Get Comment by Post ID", async () => {
    const comment = await CommentModel.create({
      userId: user._id,
      postId: post._id,
      content: "comment content",
    });

    const res = await request(await appPromise)
      .get(`/comments/post/${post._id}`)
      .set(headers);

    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].content).toEqual("comment content");
    expect(res.body[0].userId._id.toString()).toEqual(user._id);
    expect(res.body[0].postId._id.toString()).toEqual(post._id);
  });

  test("Create Comment", async () => {
    const newComment = {
      userId: user._id,
      postId: post._id,
      content: "new comment",
    };

    const res = await request(await appPromise)
      .post("/comments")
      .set(headers)
      .send(newComment);

    expect(res.statusCode).toEqual(201);

    const c = res.body;
    expect(c.content).toEqual("new comment");

    // POST response לא תמיד populated, לכן נבדוק עם DB
    const commentDB = await CommentModel.findById(c._id);
    expect(commentDB).not.toBeNull();
    expect(commentDB.content).toEqual("new comment");
    expect(commentDB.userId.toString()).toEqual(user._id);
    expect(commentDB.postId.toString()).toEqual(post._id);
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

    expect(res.statusCode).toEqual(201);
    expect(res.text).toEqual("The comment updated");

    const updatedComment = await CommentModel.findById(comment._id);
    expect(updatedComment.content).toEqual("updated content");
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

    expect(res.statusCode).toEqual(200);
    expect(res.text).toEqual("The comment deleted");

    const commentDB = await CommentModel.findById(comment._id);
    expect(commentDB).toBeNull();
  });
});
