import * as path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import app from "../src/app";
import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { UserModel } from "../src/models/user_model";
import { PostModel } from "../src/models/posts_model";

type DbUser = {
  _id: string;
  username: string;
  email: string;
};

const uniqueSuffix = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const createUser = async (prefix = "post"): Promise<DbUser> => {
  const suffix = uniqueSuffix();
  const user = await UserModel.create({
    username: `${prefix}_${suffix}`,
    email: `${prefix}_${suffix}@test.com`,
    password: "password123",
    tokens: [],
  });

  return {
    _id: user._id.toString(),
    username: user.username,
    email: user.email,
  };
};

const tokenFor = (user: DbUser) =>
  jwt.sign(
    { _id: user._id, username: user.username, email: user.email },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION as string }
  );

describe("Posts API", () => {
  beforeAll(async () => {
    await app;
  });

  afterEach(async () => {
    await PostModel.deleteMany({});
    await UserModel.deleteMany({ email: { $regex: /@test\.com$/ } });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("GET /posts without token returns 401", async () => {
    const res = await request(await app).get("/posts");

    expect(res.statusCode).toBe(401);
    expect(res.text).toContain("No token");
  });

  test("GET /posts returns posts", async () => {
    const owner = await createUser("owner");
    const token = tokenFor(owner);

    await PostModel.create({
      owner: owner._id,
      content: "A hotel review",
      photoSrc: "poster.jpg",
    });

    const res = await request(await app)
      .get("/posts")
      .set("authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("content");
  });

  test("GET /posts?postOwner filters by owner", async () => {
    const owner = await createUser("owner_filter");
    const other = await createUser("other_filter");
    const token = tokenFor(owner);

    await PostModel.create({
      owner: owner._id,
      content: "Owner post",
      photoSrc: "owner.jpg",
    });
    await PostModel.create({
      owner: other._id,
      content: "Other post",
      photoSrc: "other.jpg",
    });

    const res = await request(await app)
      .get(`/posts?postOwner=${owner._id}&offset=0`)
      .set("authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].owner._id).toBe(owner._id);
  });

  test("PUT /posts/:postId toggles like for user", async () => {
    const owner = await createUser("owner_like");
    const liker = await createUser("liker");

    const ownerToken = tokenFor(owner);

    const post = await PostModel.create({
      owner: owner._id,
      content: "Likeable hotel post",
      photoSrc: "like.jpg",
      likedBy: [],
    });

    const likeRes = await request(await app)
      .put(`/posts/${post._id}`)
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ userId: liker._id });

    expect(likeRes.statusCode).toBe(200);
    expect(likeRes.body.likedBy.length).toBe(1);

    const unlikeRes = await request(await app)
      .put(`/posts/${post._id}`)
      .set("authorization", `Bearer ${ownerToken}`)
      .send({ userId: liker._id });

    expect(unlikeRes.statusCode).toBe(200);
    expect(unlikeRes.body.likedBy.length).toBe(0);
  });

  test("PUT /posts/:postId forbids content update for non-owner", async () => {
    const owner = await createUser("owner_edit");
    const notOwner = await createUser("not_owner");

    const nonOwnerToken = tokenFor(notOwner);

    const post = await PostModel.create({
      owner: owner._id,
      content: "Original content",
      photoSrc: "orig.jpg",
    });

    const res = await request(await app)
      .put(`/posts/${post._id}`)
      .set("authorization", `Bearer ${nonOwnerToken}`)
      .send({ updatedPostContent: JSON.stringify({ content: "Hacked" }) });

    expect(res.statusCode).toBe(403);
    expect(res.text).toContain("not the owner");
  });

  test("DELETE /posts/:postId deletes post", async () => {
    const owner = await createUser("owner_delete");
    const token = tokenFor(owner);

    const post = await PostModel.create({
      owner: owner._id,
      content: "Delete me",
      photoSrc: "delete.jpg",
    });

    const res = await request(await app)
      .delete(`/posts/${post._id}`)
      .set("authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);

    const deleted = await PostModel.findById(post._id);
    expect(deleted).toBeNull();
  });

  test("GET /posts/:postId returns 404 for missing post", async () => {
    const user = await createUser("owner_missing");
    const token = tokenFor(user);
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(await app)
      .get(`/posts/${fakeId}`)
      .set("authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });
});
