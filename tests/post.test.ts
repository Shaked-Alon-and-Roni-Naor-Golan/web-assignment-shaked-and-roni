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
import * as postsModel from "../src/models/posts_model";
import { userToTokenData } from "../utils/auth/user_to_token_data";

const user = {
  _id: new mongoose.Types.ObjectId().toString(),
  username: "postTester",
  password: "password123",
  email: "tester@test.com",
};

const headers: { authorization: string } = { authorization: "" };

beforeAll(async () => {
await appPromise;

  await PostModel.deleteMany({}); 
  await UserModel.deleteMany({}); 

  await UserModel.create(user);

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
  await PostModel.deleteMany({});
});

afterAll(async () => {
  await PostModel.deleteMany({});
  await UserModel.deleteMany({ email: user.email });
  await mongoose.connection.close();
});

describe("Posts Integration Tests", () => {
  
  test("Get All Posts", async () => {
    const uniqueTitle = "Test Post " + Math.random();
    await PostModel.create({
      title: uniqueTitle,
      sender: user._id,
      content: "Hello World",
    });

    const res = await request(await appPromise)
      .get("/posts")
      .set(headers);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    
    const myPost = res.body.find((p: any) => p.title === uniqueTitle);
    expect(myPost).toBeDefined();
  });

  test("Get All Posts filtered by postSender", async () => {
    await PostModel.create({
      title: "User Post",
      sender: user._id,
      content: "Filter me",
    });

    const res = await request(await appPromise)
      .get(`/posts?postSender=${user._id}`)
      .set(headers);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].sender._id).toBe(user._id);
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
    const post = await PostModel.create({
      title: "Specific Post",
      sender: user._id,
      content: "Content",
    });

    const res = await request(await appPromise)
      .get(`/posts/${post._id}`)
      .set(headers);

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("Specific Post");
  });

  test("Get non-existing post returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(await appPromise)
      .get(`/posts/${fakeId}`)
      .set(headers);

    expect(res.statusCode).toBe(404);
  });

  test("Create Post", async () => {
    const newPost = {
      title: "New Created Post",
      sender: user._id,
      content: "Fresh Content",
    };

    const res = await request(await appPromise)
      .post("/posts")
      .set(headers)
      .send(newPost);

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe(newPost.title);
    
    const dbPost = await PostModel.findById(res.body._id);
    expect(dbPost).toBeDefined();
  });

  test("Create Post returns 500 on DB error", async () => {
    jest.spyOn(postsModel.PostModel, "create").mockImplementationOnce(() => {
      throw new Error("Save failed");
    });

    const res = await request(await appPromise)
      .post("/posts")
      .set(headers)
      .send({ title: "Fail", sender: user._id });

    expect(res.statusCode).toBe(500);
  });

  test("Update Post", async () => {
    const post = await PostModel.create({
      title: "Old Title",
      sender: user._id,
      content: "Old Content",
    });

    const res = await request(await appPromise)
      .put(`/posts/${post._id}`)
      .set(headers)
      .send({ title: "Updated Title" });

    expect(res.statusCode).toBe(201);
    
    const updatedPost = await PostModel.findById(post._id);
    expect(updatedPost?.title).toBe("Updated Title");
  });

  test("Update non-existing post returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(await appPromise)
      .put(`/posts/${fakeId}`)
      .set(headers)
      .send({ title: "Nowhere" });

    expect(res.statusCode).toBe(404);
  });

  test("Update post with invalid id returns 500", async () => {
    const res = await request(await appPromise)
      .put("/posts/invalid-id")
      .set(headers)
      .send({ title: "Invalid" });

    expect(res.statusCode).toBe(500);
  });

  test("Get Post By ID returns 500 on DB error", async () => {
  jest.spyOn(postsModel.PostModel, "findById").mockImplementationOnce(() => {
    throw new Error("DB error");
  });

  const fakeId = new mongoose.Types.ObjectId();
  const res = await request(await appPromise)
    .get(`/posts/${fakeId}`)
    .set(headers);

  expect(res.statusCode).toBe(500);
});

test("Update Post returns 500 on DB error", async () => {
  jest.spyOn(postsModel.PostModel, "updateOne").mockImplementationOnce(() => {
    throw new Error("DB error");
  });

  const fakeId = new mongoose.Types.ObjectId();
  const res = await request(await appPromise)
    .put(`/posts/${fakeId}`)
    .set(headers)
    .send({ title: "Update Fail" });

  expect(res.statusCode).toBe(500);
});

test("Update Post returns 500 on DB error", async () => {
  jest.spyOn(postsModel.PostModel, "updateOne").mockImplementationOnce(() => {
    throw new Error("DB error");
  });

  const fakeId = new mongoose.Types.ObjectId();
  const res = await request(await appPromise)
    .put(`/posts/${fakeId}`)
    .set(headers)
    .send({ title: "Update Fail" });

  expect(res.statusCode).toBe(500);
});

});