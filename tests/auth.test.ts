import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import appPromise from "../src/app";
import mongoose from "mongoose";
import request from "supertest";
import {
  afterEach,
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  jest,
} from "@jest/globals";
import { UserModel } from "../src/models/user_model";
import * as userService from "../server/services/user_service";
import * as authController from "../src/controllers/auth_controller";

const baseUser = {
  username: "auth",
  password: "auth",
  email: "auth_test@auth.auth",
};

const uniqueUser = (overrides: Partial<typeof baseUser> = {}) => {
  const uniq = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return {
    ...baseUser,
    email: `auth_${uniq}@auth.test`,
    username: `auth_${uniq}`,
    ...overrides,
  };
};

const verifyTokenPayload = (token: string, secret: string) => {
  const payload = jwt.verify(token, secret) as any;
  return { ...payload, exp: undefined, iat: undefined };
};

const nonExistingObjectId = () => new mongoose.Types.ObjectId().toString();

const signNonExistingUserRefreshToken = () =>
  jwt.sign(
    { _id: nonExistingObjectId(), username: "ghost" },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION as string }
  );

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

beforeAll(async () => {
  await appPromise;
});

afterAll(async () => {
  await UserModel.deleteMany({ email: { $regex: /^auth_.*@auth\.test$/ } });
  await mongoose.connection.close();
});

afterEach(async () => {
  jest.restoreAllMocks();
  await UserModel.deleteMany({ email: { $regex: /^auth_.*@auth\.test$/ } });
});

describe("Auth - Register (integration)", () => {
  test("Register Successfully - returns 200 and stores hashed password", async () => {
    const user = uniqueUser();

    const res = await request(await appPromise).post("/auth/register").send(user);

    expect(res.statusCode).toBe(200);
    expect(typeof res.text).toBe("string");
    expect(res.text).toContain("User completed registration");

    const dbUser = await UserModel.findOne({ email: user.email });
    expect(dbUser).not.toBeNull();

    expect((dbUser as any).email).toBe(user.email);
    expect((dbUser as any).username).toBe(user.username);

    expect((dbUser as any).password).not.toBe(user.password);
    const matches = await bcrypt.compare(user.password, (dbUser as any).password);
    expect(matches).toBe(true);
  });

  test("Register Failed, User Already Exists - returns 500", async () => {
    const user = uniqueUser();
    await UserModel.create(user);

    const res = await request(await appPromise).post("/auth/register").send(user);

    expect(res.statusCode).toBe(500);
    expect(res.text).toContain("User already exists");
  });

  test("Register Failed, Missing Required Field - returns 500", async () => {
    const user = uniqueUser();

    const res = await request(await appPromise)
      .post("/auth/register")
      .send({ email: user.email, username: user.username });

    expect(res.statusCode).toBe(500);
    expect(res.text).toBeTruthy();
  });
});

describe("Auth - Login (integration)", () => {
  test("Login Successfully - returns access+refresh tokens; refresh token stored on user", async () => {
    const user = uniqueUser();

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(user.password, salt);
    const dbUser = await UserModel.create({ ...user, password: hashedPassword });

    const res = await request(await appPromise)
      .post("/auth/login")
      .send({ email: user.email, password: user.password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");

    const accessPayload = verifyTokenPayload(
      res.body.accessToken,
      process.env.ACCESS_TOKEN_SECRET as string
    );
    const refreshPayload = verifyTokenPayload(
      res.body.refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    );

    expect(accessPayload).toEqual({
      _id: (dbUser as any)._id.toString(),
      username: user.username,
    });
    expect(refreshPayload).toEqual({
      _id: (dbUser as any)._id.toString(),
      username: user.username,
    });

    const updatedUser = await UserModel.findOne({ email: user.email });
    expect((updatedUser as any).refreshTokens).toContain(res.body.refreshToken);
  });

  test("Login Failed, User Doesn't Exist - returns 500", async () => {
    const user = uniqueUser();

    const res = await request(await appPromise)
      .post("/auth/login")
      .send({ email: user.email, password: user.password });

    expect(res.statusCode).toBe(500);
    expect(res.text).toContain("Invalid Credentials");
  });

  test("Login Failed, Wrong Password - returns 500", async () => {
    const user = uniqueUser();

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash("correct_password", salt);
    await UserModel.create({ ...user, password: hashedPassword });

    const res = await request(await appPromise)
      .post("/auth/login")
      .send({ email: user.email, password: "wrong_password" });

    expect(res.statusCode).toBe(500);
    expect(res.text).toContain("Invalid Credentials");
  });

  test("Login Twice - should append refresh tokens (not overwrite)", async () => {
    const user = uniqueUser();

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(user.password, salt);
    await UserModel.create({ ...user, password: hashedPassword });

    const res1 = await request(await appPromise)
      .post("/auth/login")
      .send({ email: user.email, password: user.password });
    expect(res1.statusCode).toBe(200);

    const res2 = await request(await appPromise)
      .post("/auth/login")
      .send({ email: user.email, password: user.password });
    expect(res2.statusCode).toBe(200);

    const dbUser = await UserModel.findOne({ email: user.email });
    expect((dbUser as any).refreshTokens).toEqual(
      expect.arrayContaining([res1.body.refreshToken, res2.body.refreshToken])
    );
    expect((dbUser as any).refreshTokens.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Auth - Logout (integration)", () => {
  let user: ReturnType<typeof uniqueUser>;
  let dbUserId: string;
  let validRefreshToken: string;

  beforeEach(async () => {
    user = uniqueUser();

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(user.password, salt);
    const newUser = await UserModel.create({ ...user, password: hashedPassword });

    dbUserId = (newUser as any)._id.toString();

    validRefreshToken = jwt.sign(
      { _id: dbUserId, username: user.username },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION as string }
    );

    (newUser as any).refreshTokens = [validRefreshToken];
    await (newUser as any).save();
  });

  test("Logout Successfully - removes token from user's refreshTokens", async () => {
    const res = await request(await appPromise)
      .post("/auth/logout")
      .set("Authorization", "Bearer " + validRefreshToken);

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Logged out");

    const updated = await UserModel.findById(dbUserId);
    expect((updated as any).refreshTokens || []).toHaveLength(0);
  });

  test("Logout Failed, No Token Provided - returns 401", async () => {
    const res = await request(await appPromise).post("/auth/logout");
    expect(res.statusCode).toBe(401);
    expect(res.text).toContain("Refresh token is not provided");
  });

  test("Logout Failed, Invalid Token - returns 403", async () => {
    const res = await request(await appPromise)
      .post("/auth/logout")
      .set("Authorization", "Bearer invalidToken");

    expect(res.statusCode).toBe(403);
    expect(res.text).toContain("Unauthorized");
  });

  test("Logout Failed, User Not Found - returns 403", async () => {
    const invalidUserToken = signNonExistingUserRefreshToken();

    const res = await request(await appPromise)
      .post("/auth/logout")
      .set("Authorization", "Bearer " + invalidUserToken);

    expect(res.statusCode).toBe(403);
    expect(res.text).toContain("Unauthorized");
  });

  test("Logout Failed, Token Not In User List - clears refreshTokens and returns 403", async () => {
    const notStoredToken = jwt.sign(
      { _id: dbUserId, username: user.username + "_DIFFERENT" },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION as string }
    );

    const res = await request(await appPromise)
      .post("/auth/logout")
      .set("Authorization", "Bearer " + notStoredToken);

    expect(res.statusCode).toBe(403);
    expect(res.text).toContain("Unauthorized");

    const updated = await UserModel.findById(dbUserId);
    expect((updated as any).refreshTokens || []).toHaveLength(0);
  });
});

describe("Auth - Refresh Token (integration)", () => {
  let user: ReturnType<typeof uniqueUser>;
  let dbUserId: string;
  let validRefreshToken: string;

  beforeEach(async () => {
    user = uniqueUser();

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(user.password, salt);
    const newUser = await UserModel.create({ ...user, password: hashedPassword });

    dbUserId = (newUser as any)._id.toString();

    validRefreshToken = jwt.sign(
      { _id: dbUserId, username: user.username },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION as string }
    );

    (newUser as any).refreshTokens = [validRefreshToken];
    await (newUser as any).save();
  });

  test("Refresh Token Successfully - returns new tokens; replaces old refresh token in DB", async () => {
    const res = await request(await appPromise)
      .post("/auth/refresh-token")
      .set("Authorization", "Bearer " + validRefreshToken);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");

    const newAccessToken = res.body.accessToken;
    const newRefreshToken = res.body.refreshToken;

    expect(typeof newAccessToken).toBe("string");
    expect(typeof newRefreshToken).toBe("string");

    const accessPayload = verifyTokenPayload(
      newAccessToken,
      process.env.ACCESS_TOKEN_SECRET as string
    );
    const refreshPayload = verifyTokenPayload(
      newRefreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    );

    expect(accessPayload).toEqual({ _id: dbUserId, username: user.username });
    expect(refreshPayload).toEqual({ _id: dbUserId, username: user.username });

    const updated = await UserModel.findById(dbUserId);
    expect(updated).not.toBeNull();
    expect((updated as any).refreshTokens).toHaveLength(1);
    expect((updated as any).refreshTokens[0]).toBe(newRefreshToken);
  });

  test("Refresh Token Failed, No Token Provided - returns 401", async () => {
    const res = await request(await appPromise).post("/auth/refresh-token");
    expect(res.statusCode).toBe(401);
    expect(res.text).toContain("Unauthorized");
  });

  test("Refresh Token Failed, Wrong Token - returns 403", async () => {
    const res = await request(await appPromise)
      .post("/auth/refresh-token")
      .set("Authorization", "Bearer invalidToken");

    expect(res.statusCode).toBe(403);
    expect(res.text).toContain("Unauthorized");
  });

  test("Refresh Token Failed, No User - returns 403", async () => {
    const invalidUserToken = signNonExistingUserRefreshToken();

    const res = await request(await appPromise)
      .post("/auth/refresh-token")
      .set("Authorization", "Bearer " + invalidUserToken);

    expect(res.statusCode).toBe(403);
    expect(res.text).toContain("Unauthorized");
  });

  test("Refresh Token Failed, Token Not In User List - clears refreshTokens and returns 403", async () => {
    const notStoredToken = jwt.sign(
      { _id: dbUserId, username: user.username + "_DIFFERENT" },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION as string }
    );

    const res = await request(await appPromise)
      .post("/auth/refresh-token")
      .set("Authorization", "Bearer " + notStoredToken);

    expect(res.statusCode).toBe(403);
    expect(res.text).toContain("Unauthorized");

    const updated = await UserModel.findById(dbUserId);
    expect(updated).not.toBeNull();
    expect((updated as any).refreshTokens || []).toHaveLength(0);
  });
});

/**
 * UNIT TESTS to cover controller catch/edge branches
 * (These increase controller coverage without changing app behavior)
 */
describe("Auth controller - error branches (unit)", () => {
  test("register: returns 500 when UserModel.findOne throws", async () => {
    const user = uniqueUser();
    const req: any = { body: user };
    const res = mockRes();

    jest.spyOn(UserModel, "findOne").mockRejectedValueOnce(new Error("db down"));

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalled();
  });

  test("register: returns 500 when createNewUser throws", async () => {
    const user = uniqueUser();
    const req: any = { body: user };
    const res = mockRes();

    jest.spyOn(UserModel, "findOne").mockResolvedValueOnce(null as any);
    jest
      .spyOn(userService, "createNewUser")
      .mockRejectedValueOnce(new Error("insert failed"));

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalled();
  });

  test("logout: returns 403 when findUserById throws inside verify callback", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const refreshToken = jwt.sign(
      { _id: userId, username: "x" },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION as string }
    );

    const verifySpy = jest
      .spyOn(jwt, "verify")
      .mockImplementation((t: any, s: any, cb: any) => {
        cb(null, { _id: userId });
        return {} as any;
      });

    jest
      .spyOn(userService, "findUserById")
      .mockRejectedValueOnce(new Error("service error"));

    const req: any = { headers: { authorization: "Bearer " + refreshToken } };
    const res = mockRes();

    await authController.logout(req, res, jest.fn() as any);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalled();

    verifySpy.mockRestore();
  });

  test("refreshToken: returns 403 when UserModel.findById throws inside verify callback", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const refreshToken = jwt.sign(
      { _id: userId, username: "x" },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION as string }
    );

    const verifySpy = jest
      .spyOn(jwt, "verify")
      .mockImplementation((t: any, s: any, cb: any) => {
        cb(null, { _id: userId });
        return {} as any;
      });

    jest
      .spyOn(UserModel, "findById")
      .mockRejectedValueOnce(new Error("db find error"));

    const req: any = { headers: { authorization: "Bearer " + refreshToken } };
    const res = mockRes();

    await authController.refreshToken(req, res, jest.fn() as any);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalled();

    verifySpy.mockRestore();
  });
});
