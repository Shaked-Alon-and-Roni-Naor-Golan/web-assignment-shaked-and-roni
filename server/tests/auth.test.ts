import * as path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import bcrypt from "bcrypt";
import app from "../src/app";
import request from "supertest";
import mongoose from "mongoose";
import { UserModel } from "../src/models/user_model";

const uniqueSuffix = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const uniqueCreds = () => {
  const suffix = uniqueSuffix();
  return {
    username: `auth_${suffix}`,
    email: `auth_${suffix}@test.com`,
    password: "password123",
  };
};

describe("Auth API", () => {
  const createdUserIds = new Set<string>();

  const trackCreatedUser = async (user: {
    username: string;
    email: string;
    password: string;
    tokens?: string[];
  }) => {
    const created = await UserModel.create(user);
    createdUserIds.add(created._id.toString());
    return created;
  };

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

  test("POST /api/auth/register registers user and returns tokens", async () => {
    const user = uniqueCreds();

    const res = await request(await app)
      .post("/api/auth/register")
      .field("user", JSON.stringify(user));

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body).toHaveProperty("user");

    const dbUser = await UserModel.findOne({ email: user.email });
    if (dbUser?._id) {
      createdUserIds.add(dbUser._id.toString());
    }
    expect(dbUser).not.toBeNull();
    expect((dbUser as any).password).not.toBe(user.password);
  });

  test("POST /api/auth/login succeeds with username/password", async () => {
    const user = uniqueCreds();
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(user.password, salt);

    await trackCreatedUser({ ...user, password: hashedPassword, tokens: [] });

    const res = await request(await app)
      .post("/api/auth/login")
      .send({ username: user.username, password: user.password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body.accessToken).toHaveProperty("token");
    expect(res.body.refreshToken).toHaveProperty("token");
  });

  test("POST /api/auth/login fails with bad credentials", async () => {
    const user = uniqueCreds();

    const res = await request(await app)
      .post("/api/auth/login")
      .send({ username: user.username, password: user.password });

    expect(res.statusCode).toBe(500);
    expect(res.text).toContain("Invalid Credentials");
  });

  test("POST /api/auth/refresh-token returns unauthorized with refresh token", async () => {
    const user = uniqueCreds();
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(user.password, salt);

    await trackCreatedUser({ ...user, password: hashedPassword, tokens: [] });

    const loginRes = await request(await app)
      .post("/api/auth/login")
      .send({ username: user.username, password: user.password });

    const refreshToken = loginRes.body.refreshToken.token;

    const res = await request(await app)
      .post("/api/auth/refresh-token")
      .set("authorization", `Bearer ${refreshToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.text).toContain("Unauthorized");
  });

  test("POST /api/auth/logout returns unauthorized with refresh token", async () => {
    const user = uniqueCreds();
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(user.password, salt);

    await trackCreatedUser({ ...user, password: hashedPassword, tokens: [] });

    const loginRes = await request(await app)
      .post("/api/auth/login")
      .send({ username: user.username, password: user.password });

    const refreshToken = loginRes.body.refreshToken.token;

    const logoutRes = await request(await app)
      .post("/api/auth/logout")
      .set("authorization", `Bearer ${refreshToken}`);

    expect(logoutRes.statusCode).toBe(403);
    expect(logoutRes.text).toContain("Unauthorized");
  });

  test("POST /api/auth/logout returns unauthorized even if user was deleted", async () => {
    const user = uniqueCreds();
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(user.password, salt);

    const dbUser = await trackCreatedUser({ ...user, password: hashedPassword, tokens: [] });

    const loginRes = await request(await app)
      .post("/api/auth/login")
      .send({ username: user.username, password: user.password });

    const refreshToken = loginRes.body.refreshToken.token;

    await UserModel.findByIdAndDelete(dbUser._id);

    const logoutRes = await request(await app)
      .post("/api/auth/logout")
      .set("authorization", `Bearer ${refreshToken}`);

    expect(logoutRes.statusCode).toBe(403);
    expect(logoutRes.text).toContain("Unauthorized");
  });

  test("POST /api/auth/logout without token returns 401", async () => {
    const res = await request(await app).post("/api/auth/logout");

    expect(res.statusCode).toBe(401);
    expect(res.text).toContain("No token provided");
  });
});