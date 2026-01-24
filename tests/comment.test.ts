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

const comment = {
  userId: user._id,
  postId: post._id,
  content: "content",
};

const headers = { authorization: "" };

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
  await PostModel.deleteMany({ sender: post.sender });
  await UserModel.deleteMany({ email: user.email });

  await mongoose.connection.close();
});

afterEach(async () => {
  await CommentModel.deleteMany({ user: comment.userId });
});

describe("Comments", () => {
  test("Get All Comments", async () => {
    await CommentModel.create(comment);

    const res = await request(await appPromise)
      .get("/comments")
      .set(headers);

    expect(res.statusCode).toEqual(200);
  });

  test("Get Comment By ID", async () => {
    const commentId = (await CommentModel.create(comment))._id;

    const res = await request(await appPromise)
      .get(`/comments/${commentId}`)
      .set(headers);

    expect(res.statusCode).toEqual(200);

    expect({ postId: post._id, userId: user._id, content: comment.content }).toEqual(comment);
  });

  test("Get Comment by Post ID", async () => {
    await CommentModel.create(comment);

    const res = await request(await appPromise)
      .get(`/comments/post/${comment.postId}`)
      .set(headers);

    expect(res.statusCode).toEqual(200);
  });

//   test("Create Comment", async () => {
//     const res = await request(await appPromise)
//       .post("/comments/")
//       .set(headers)
//       .send(comment);

//     expect(res.statusCode).toEqual(201);

//     const { post, user, content } = res.body;
//     expect({ post, user, content }).toEqual(comment);

//     const {
//       postId: postDB,
//       userId: ownerDB,
//       content: contentDB,
//     } = await CommentModel.findOne({ user: comment.userId });
//     expect({
//       post: postDB._id.toString(),
//       user: ownerDB._id.toString(),
//       content: contentDB,
//     }).toEqual(comment);
//   });

//   test("Update Comment", async () => {
//     const commentId = (await CommentModel.create(comment))._id;

//     const res = await request(await appPromise)
//       .put(`/comments/${commentId}`)
//       .set(headers)
//       .send({ content: "content" });

//     expect(res.statusCode).toEqual(201);

//     const { content, userId, postId } = await CommentModel.findOne({
//       _id: commentId,
//     });
//     expect({
//       content,
//       userId: user._id.toString(),
//       postId: post._id.toString(),
//     }).toEqual({ content: "content2", user: comment.userId, post: comment.postId });
//   });

//   test("Delete Comment", async () => {
//     const commentId = (await CommentModel.create(comment))._id;

//     const res = await request(await appPromise)
//       .delete(`/comments/${commentId}`)
//       .set(headers);

//     expect(res.statusCode).toEqual(200);

//     const commentDB = await CommentModel.findOne({ _id: commentId });
//     expect(commentDB).toBeNull();
//   });
});