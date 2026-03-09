import * as path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import app from "../src/app";
import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { UserModel } from "../src/models/user_model";
import { PostModel } from "../src/models/posts_model";
import { CommentModel } from "../src/models/comments_model";

type DbUser = {
  _id: string;
  username: string;
  email: string;
};

const uniqueSuffix = () =>
  `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const createUser = async (
  prefix = "comment"
): Promise<{ user: DbUser; token: string }> => {
  const suffix = uniqueSuffix();

  const user = await UserModel.create({
    username: `${prefix}_${suffix}`,
    email: `${prefix}_${suffix}@test.com`,
    password: "password123",
    tokens: [],
  });

  const token = jwt.sign(
    {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
    },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION as string }
  );

  user.tokens = [token];
  await user.save();

  return {
    user: {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
    },
    token,
  };
};

describe("Comments API", () => {
  const createdUserIds = new Set<string>();
  const createdPostIds = new Set<string>();
  const createdCommentIds = new Set<string>();

  const trackPost = async (post: {
    owner: string;
    content: string;
    photoSrc?: string;
    comments?: string[];
  }) => {
    const created = await PostModel.create(post);
    createdPostIds.add(created._id.toString());
    return created;
  };

  const trackComment = async (comment: { user: string; content: string }) => {
    const created = await CommentModel.create(comment);
    createdCommentIds.add(created._id.toString());
    return created;
  };

  beforeAll(async () => {
    await app;
  });

  afterEach(async () => {
    if (createdCommentIds.size > 0) {
      await CommentModel.deleteMany({ _id: { $in: Array.from(createdCommentIds) } });
      createdCommentIds.clear();
    }

    if (createdPostIds.size > 0) {
      await PostModel.deleteMany({ _id: { $in: Array.from(createdPostIds) } });
      createdPostIds.clear();
    }

    if (createdUserIds.size > 0) {
      await UserModel.deleteMany({ _id: { $in: Array.from(createdUserIds) } });
      createdUserIds.clear();
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("POST /comments creates comment and links it to post", async () => {
    const { user, token } = await createUser("comment_user");
    createdUserIds.add(user._id);

    const post = await trackPost({
      owner: user._id,
      content: "Hotel thread",
      photoSrc: "hotel.jpg",
      comments: [],
    });

    const res = await request(await app)
      .post("/comments")
      .set("authorization", `Bearer ${token}`)
      .send({
        postId: post._id,
        comment: {
          user: user._id,
          content: "Great hotel!",
        },
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.content).toBe("Great hotel!");

    const updatedPost = await PostModel.findById(post._id);
    expect((updatedPost?.comments || []).length).toBe(1);
  });

  test("GET /comments returns list", async () => {
    const { user, token } = await createUser("comments_get");
    createdUserIds.add(user._id);

    await trackComment({ user: user._id, content: "one" });

    const res = await request(await app)
      .get("/comments")
      .set("authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("GET /comments?user filters by user", async () => {
    const { user: userA, token } = await createUser("comments_a");
    const { user: userB } = await createUser("comments_b");
    createdUserIds.add(userA._id);
    createdUserIds.add(userB._id);

    await trackComment({ user: userA._id, content: "A" });
    await trackComment({ user: userB._id, content: "B" });

    const res = await request(await app)
      .get(`/comments?user=${userA._id}`)
      .set("authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

  test("PUT /comments/:commentId updates comment", async () => {
    const { user, token } = await createUser("comments_update");
    createdUserIds.add(user._id);

    const comment = await trackComment({
      user: user._id,
      content: "old",
    });

    const res = await request(await app)
      .put(`/comments/${comment._id}`)
      .set("authorization", `Bearer ${token}`)
      .send({ content: "updated" });

    expect(res.statusCode).toBe(201);

    const updated = await CommentModel.findById(comment._id);
    expect(updated?.content).toBe("updated");
  });

  test("DELETE /comments/:commentId deletes comment", async () => {
    const { user, token } = await createUser("comments_delete");
    createdUserIds.add(user._id);

    const comment = await trackComment({
      user: user._id,
      content: "bye",
    });

    const res = await request(await app)
      .delete(`/comments/${comment._id}`)
      .set("authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);

    const deleted = await CommentModel.findById(comment._id);
    expect(deleted).toBeNull();
  });

  test("GET /comments/:commentId returns 404 for missing comment", async () => {
    const { user, token } = await createUser("comments_missing");
    createdUserIds.add(user._id);
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(await app)
      .get(`/comments/${fakeId}`)
      .set("authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });
});