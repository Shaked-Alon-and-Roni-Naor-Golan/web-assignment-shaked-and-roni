import * as path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import app from "../src/app";
import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { UserModel } from "../src/models/user_model";

type DbUser = {
  _id: string;
  username: string;
  email: string;
};

const uniqueSuffix = () =>
  `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const createUser = async (): Promise<{ user: DbUser; token: string }> => {
  const suffix = uniqueSuffix();

  const user = await UserModel.create({
    username: `user_${suffix}`,
    email: `user_${suffix}@test.com`,
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

  // ✅ Save token in DB so middleware accepts it
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

describe("Users API", () => {
  const createdUserIds = new Set<string>();

  beforeAll(async () => {
    await app;
  });

  afterEach(async () => {
    if (createdUserIds.size > 0) {
      await UserModel.deleteMany({ _id: { $in: Array.from(createdUserIds) } });
      createdUserIds.clear();
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("GET /users/me without token returns 401", async () => {
    const res = await request(await app).get("/users/me");

    expect(res.statusCode).toBe(401);
    expect(res.text).toContain("No token");
  });

  test("GET /users/me with token returns current user payload", async () => {
    const { user, token } = await createUser();
    createdUserIds.add(user._id);

    const res = await request(await app)
      .get("/users/me")
      .set("authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(user._id);
    expect(res.body.username).toBe(user.username);
    expect(res.body.email).toBe(user.email);
  });

  test("PUT /users/:userId updates username", async () => {
    const { user, token } = await createUser();
    createdUserIds.add(user._id);

    const res = await request(await app)
      .put(`/users/${user._id}`)
      .set("authorization", `Bearer ${token}`)
      .send({ username: "updated_user_name" });

    expect(res.statusCode).toBe(201);
    expect(res.body.username).toBe("updated_user_name");

    const updated = await UserModel.findById(user._id);
    expect(updated?.username).toBe("updated_user_name");
  });

  test("PUT /users/:userId returns 404 for non-existing user", async () => {
    const { user, token } = await createUser();
    createdUserIds.add(user._id);

    const fakeId = "507f1f77bcf86cd799439011";

    const res = await request(await app)
      .put(`/users/${fakeId}`)
      .set("authorization", `Bearer ${token}`)
      .send({ username: "any" });

    expect(res.statusCode).toBe(404);
    expect(res.text).toContain("Cannot find specified user");
  });
});