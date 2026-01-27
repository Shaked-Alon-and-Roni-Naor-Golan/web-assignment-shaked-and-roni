import appPromise from "../app";
import mongoose from "mongoose";
import request from "supertest";
import { UserModel } from "../models/user_model";
import { generateAccessToken } from "../utils/auth/generate_access_token";
import {
  afterEach,
  afterAll,
  beforeAll,
  describe,
  expect,
  test,
} from "@jest/globals";
import { userToTokenData } from "../utils/auth/user_to_token_data";

const authUser = {
  username: "auth",
  password: "auth",
  email: "user@auth.auth",
};

const baseUser = {
  username: "test",
  password: "test",
  email: "test@test.test",
};

const headers = { authorization: "" };
const getAuthHeaders = () => headers;

const uniqueUser = (overrides: Partial<typeof baseUser> = {}) => {
  const uniq = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return {
    ...baseUser,
    email: `test_${uniq}@test.test`,
    username: `test_${uniq}`,
    ...overrides,
  };
};

beforeAll(async () => {
  await appPromise;

  await UserModel.deleteMany({ email: authUser.email });
  await UserModel.create(authUser);

  const authDbUser = await UserModel.findOne({ email: authUser.email });
  headers.authorization =
    "Bearer " +
    generateAccessToken(
      userToTokenData(authDbUser as any),
      process.env.ACCESS_TOKEN_SECRET as string,
      process.env.ACCESS_TOKEN_EXPIRATION as string
    );
});

afterAll(async () => {
  await UserModel.deleteMany({
    email: { $regex: /^test_.*@test\.test$/ },
  });
  await UserModel.deleteMany({ email: authUser.email });

  await mongoose.connection.close();
});

afterEach(async () => {
  jest.restoreAllMocks();

  await UserModel.deleteMany({
    email: { $regex: /^test_.*@test\.test$/ },
  });
});

describe("Users API (protected)", () => {
  test("Should reject requests without Authorization header (middleware)", async () => {
    const res = await request(await appPromise).get("/users");
    expect(res.statusCode).toBe(401);
    expect(res.text).toContain("No token");
  });

  test("Should reject requests with invalid token (middleware)", async () => {
    const res = await request(await appPromise)
      .get("/users")
      .set({ authorization: "Bearer invalid.token.here" });

    expect(res.statusCode).toBe(403);
    expect(res.text).toContain("Unauthorized");
  });

  test("GET /users returns an array (and includes created users)", async () => {
    const u1 = uniqueUser();
    const u2 = uniqueUser();
    await UserModel.create([u1, u2]);

    const res = await request(await appPromise)
      .get("/users")
      .set(getAuthHeaders());

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const emails = res.body.map((u: any) => u.email);
    expect(emails).toEqual(expect.arrayContaining([u1.email, u2.email]));
  });

  test("GET /users returns 500 when DB throws (covers catch)", async () => {
    jest.spyOn(UserModel, "find").mockRejectedValueOnce(new Error("db fail"));

    const res = await request(await appPromise)
      .get("/users")
      .set(getAuthHeaders());

    expect(res.statusCode).toBe(500);
    expect(res.text).toContain("db fail");
  });

  test("GET /users/:id returns 404 when user does not exist", async () => {
    const nonExistingId = new mongoose.Types.ObjectId().toString();

    const res = await request(await appPromise)
      .get("/users/" + nonExistingId)
      .set(getAuthHeaders());

    expect(res.statusCode).toBe(404);
    expect(res.text).toContain("Cannot find specified post");
  });

  test("GET /users/:id returns 500 when DB throws (covers catch)", async () => {
    const someId = new mongoose.Types.ObjectId().toString();
    jest.spyOn(UserModel, "findById").mockRejectedValueOnce(new Error("db fail"));

    const res = await request(await appPromise)
      .get("/users/" + someId)
      .set(getAuthHeaders());

    expect(res.statusCode).toBe(500);
    expect(res.text).toContain("db fail");
  });

  test("GET /users/:id returns user by id with correct fields", async () => {
    const u = uniqueUser();
    await UserModel.create(u);

    const dbUser = await UserModel.findOne({ email: u.email });
    const id = (dbUser as any)._id.toString();

    const res = await request(await appPromise)
      .get("/users/" + id)
      .set(getAuthHeaders());

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        email: u.email,
        username: u.username,
        password: u.password,
      })
    );
    expect(res.body._id).toBeDefined();
  });

  test("POST /users creates user and persists it in DB", async () => {
    const u = uniqueUser();

    const res = await request(await appPromise)
      .post("/users")
      .set(getAuthHeaders())
      .send(u);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        email: u.email,
        username: u.username,
        password: u.password,
      })
    );
    expect(res.body._id).toBeDefined();

    const dbUser = await UserModel.findOne({ email: u.email });
    expect(dbUser).not.toBeNull();
    expect({
      email: (dbUser as any).email,
      username: (dbUser as any).username,
      password: (dbUser as any).password,
    }).toEqual({
      email: u.email,
      username: u.username,
      password: u.password,
    });
  });

  test("POST /users fails with 500 when required fields are missing", async () => {
    const res = await request(await appPromise)
      .post("/users")
      .set(getAuthHeaders())
      .send({ username: "only-username" });

    expect(res.statusCode).toBe(500);
    expect(res.text).toBeTruthy();
  });

  test("POST /users returns 500 when DB throws (covers catch)", async () => {
    jest.spyOn(UserModel, "create").mockRejectedValueOnce(new Error("db fail"));

    const res = await request(await appPromise)
      .post("/users")
      .set(getAuthHeaders())
      .send(uniqueUser());

    expect(res.statusCode).toBe(500);
    expect(res.text).toContain("db fail");
  });

  test("PUT /users/:id updates user and returns 201; DB reflects changes", async () => {
    const u = uniqueUser();
    await UserModel.create(u);

    const dbUser = await UserModel.findOne({ email: u.email });
    const id = (dbUser as any)._id.toString();

    const res = await request(await appPromise)
      .put("/users/" + id)
      .set(getAuthHeaders())
      .send({ username: "test2" });

    expect(res.statusCode).toBe(201);

    const updated = await UserModel.findById(id);
    expect(updated).not.toBeNull();
    expect((updated as any).username).toBe("test2");
    expect((updated as any).email).toBe(u.email);
    expect((updated as any).password).toBe(u.password);
  });

  test("PUT /users/:id returns 404 when updating a non-existing user", async () => {
    const nonExistingId = new mongoose.Types.ObjectId().toString();

    const res = await request(await appPromise)
      .put("/users/" + nonExistingId)
      .set(getAuthHeaders())
      .send({ username: "nope" });

    expect(res.statusCode).toBe(404);
    expect(res.text).toContain("Cannot find specified post");
  });

  test("PUT /users/:id returns 500 when DB throws (covers catch)", async () => {
    const someId = new mongoose.Types.ObjectId().toString();
    jest
      .spyOn(UserModel, "updateOne")
      .mockRejectedValueOnce(new Error("db fail"));

    const res = await request(await appPromise)
      .put("/users/" + someId)
      .set(getAuthHeaders())
      .send({ username: "boom" });

    expect(res.statusCode).toBe(500);
    expect(res.text).toContain("db fail");
  });

  test("DELETE /users/:id deletes user and returns 201; user is removed from DB", async () => {
    const u = uniqueUser();
    await UserModel.create(u);

    const dbUser = await UserModel.findOne({ email: u.email });
    const id = (dbUser as any)._id.toString();

    const res = await request(await appPromise)
      .delete("/users/" + id)
      .set(getAuthHeaders());

    expect(res.statusCode).toBe(201);

    const deleted = await UserModel.findById(id);
    expect(deleted).toBeNull();
  });

  test("DELETE /users/:id returns 404 when deleting a non-existing user", async () => {
    const nonExistingId = new mongoose.Types.ObjectId().toString();

    const res = await request(await appPromise)
      .delete("/users/" + nonExistingId)
      .set(getAuthHeaders());

    expect(res.statusCode).toBe(404);
    expect(res.text).toContain("Cannot find specified post");
  });

  test("DELETE /users/:id returns 500 when DB throws (covers catch)", async () => {
    const someId = new mongoose.Types.ObjectId().toString();
    jest
      .spyOn(UserModel, "deleteOne")
      .mockRejectedValueOnce(new Error("db fail"));

    const res = await request(await appPromise)
      .delete("/users/" + someId)
      .set(getAuthHeaders());

    expect(res.statusCode).toBe(500);
    expect(res.text).toContain("db fail");
  });

  test("Create + Update + Get flows together (smoke/integration)", async () => {
    const u = uniqueUser();

    const createRes = await request(await appPromise)
      .post("/users")
      .set(getAuthHeaders())
      .send(u);
    expect(createRes.statusCode).toBe(200);

    const id = createRes.body._id;
    expect(id).toBeDefined();

    const updateRes = await request(await appPromise)
      .put("/users/" + id)
      .set(getAuthHeaders())
      .send({ username: "updated_name" });
    expect(updateRes.statusCode).toBe(201);

    const getRes = await request(await appPromise)
      .get("/users/" + id)
      .set(getAuthHeaders());
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body).toEqual(
      expect.objectContaining({
        email: u.email,
        username: "updated_name",
        password: u.password,
      })
    );
  });
});
