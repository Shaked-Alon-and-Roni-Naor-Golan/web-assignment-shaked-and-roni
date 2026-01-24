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

const user = { username: "test", password: "test", email: "test@test.test" };

const users = [
  {
    ...user,
  },
  {
    ...user,
  },
];

const headers = { authorization: "" };

beforeAll(async () => {
  await appPromise;
  await UserModel.create(authUser);
  headers.authorization =
    "Bearer " +
    generateAccessToken(
      userToTokenData(await UserModel.findOne({ email: authUser.email })),
      process.env.ACCESS_TOKEN_SECRET,
      process.env.ACCESS_TOKEN_EXPIRATION
    );
});

afterAll(async () => {
  await UserModel.deleteMany({ email: { $in: [user.email, authUser.email] } });
  await mongoose.connection.close();
});

afterEach(async () => {
  await UserModel.deleteMany({ email: user.email });
});

describe("Users", () => {
  test("Get Many Students", async () => {
    await UserModel.create(users);
    const res = await request(await appPromise)
      .get("/users")
      .set(headers);
    expect(res.statusCode).toEqual(200);
  });

  test("Get User by ID", async () => {
    await UserModel.create(user);
    const id = (await UserModel.findOne({ email: user.email }))._id;
    const res = await request(await appPromise)
      .get("/users/" + id)
      .set(headers);
    expect(res.statusCode).toEqual(200);
    const { email, password, username } = res.body;
    expect({ email, password, username }).toEqual(user);
  });

  test("Create User", async () => {
    const res = await request(await appPromise)
      .post("/users/")
      .set(headers)
      .send(user);
    expect(res.statusCode).toEqual(200);
    const { email, password, username } = res.body;
    expect({ email, password, username }).toEqual(user);

    const {
      email: emailDB,
      password: passwordDB,
      username: usernameDB,
    } = await UserModel.findOne({
      email: user.email,
    });
    expect({
      email: emailDB,
      password: passwordDB,
      username: usernameDB,
    }).toEqual(user);
  });

  test("Update User", async () => {
    await UserModel.create(user);
    const id = (await UserModel.findOne({ email: user.email }))._id;

    const res = await request(await appPromise)
      .put("/users/" + id)
      .set(headers)
      .send({ username: "test2" });
    expect(res.statusCode).toEqual(201);
    const { email, password, username } = await UserModel.findOne({
      username: "test2",
    });
    expect({ email, password, username }).toEqual({
      username: "test2",
      email: user.email,
      password: user.password,
    });
  });

  test("Delete User", async () => {
    await UserModel.create(user);
    const id = (await UserModel.findOne({ email: user.email }))._id;

    const res = await request(await appPromise)
      .delete("/users/" + id)
      .set(headers);
    expect(res.statusCode).toEqual(201);
    const deletedUser = await UserModel.findOne({
      email: user.email,
    });
    expect(deletedUser).toBeNull();
  });
});