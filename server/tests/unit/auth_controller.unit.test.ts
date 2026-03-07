import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import {
  register,
  login,
  logout,
  refreshToken,
  googleLogin,
} from "../../src/controllers/auth_controller";
import { UserModel } from "../../src/models/user_model";
import * as multerUtils from "../../src/utils/multer";
import * as authUtils from "../../src/utils/auth/auth";

describe("auth_controller unit", () => {
  const mockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.sendStatus = jest.fn().mockReturnValue(res);
    return res;
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("register returns 400 when username already exists", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockResolvedValueOnce();
    jest.spyOn(UserModel, "findOne").mockResolvedValueOnce({ _id: "u1" } as any);

    const req: any = {
      body: { user: JSON.stringify({ username: "dup", email: "x@test.com", password: "p" }) },
      file: { filename: "photo.jpg" },
    };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("register returns 400 when email already exists", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockResolvedValueOnce();
    jest
      .spyOn(UserModel, "findOne")
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce({ _id: "u2" } as any);

    const req: any = {
      body: { user: JSON.stringify({ username: "ok", email: "dup@test.com", password: "p" }) },
      file: { filename: "photo.jpg" },
    };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("register returns 500 when upload fails", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockRejectedValueOnce(new Error("upload fail"));
    const delSpy = jest.spyOn(multerUtils, "deleteFile").mockImplementation(() => {});

    const req: any = {
      body: { user: JSON.stringify({ username: "u", email: "u@test.com", password: "p" }) },
      file: { filename: "tmp.jpg" },
    };
    const res = mockRes();

    await register(req, res);

    expect(delSpy).toHaveBeenCalledWith("tmp.jpg");
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("login returns 500 on wrong password branch", async () => {
    jest.spyOn(UserModel, "findOne").mockResolvedValueOnce({ password: "hashed" } as any);
    (jest.spyOn(bcrypt, "compare") as any).mockImplementationOnce(async () => false);

    const req: any = { body: { username: "u", password: "wrong" } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Invalid Credentials");
  });

  test("logout returns 403 when jwt verify fails", async () => {
    jest.spyOn(jwt, "verify").mockImplementation((token: any, secret: any, cb: any) => {
      cb(new Error("bad"), null);
      return {} as any;
    });

    const req: any = { headers: { authorization: "Bearer bad" } };
    const res = mockRes();

    logout(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith("Unauthorized");
  });

  test("logout returns 403 and clears tokens when token not in user list", async () => {
    jest.spyOn(jwt, "verify").mockImplementation((token: any, secret: any, cb: any) => {
      cb(null, { _id: "u1" });
      return {} as any;
    });

    const save = jest.fn().mockResolvedValue(undefined);
    jest.spyOn(UserModel, "findById").mockResolvedValueOnce({
      _id: "u1",
      tokens: ["different"],
      save,
    } as any);

    const req: any = { headers: { authorization: "Bearer tokenA" } };
    const res = mockRes();

    logout(req, res);
    await new Promise((resolve) => setImmediate(resolve));

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("logout returns 403 when user not found", async () => {
    jest.spyOn(jwt, "verify").mockImplementation((token: any, secret: any, cb: any) => {
      cb(null, { _id: "u1" });
      return {} as any;
    });
    jest.spyOn(UserModel, "findById").mockResolvedValueOnce(null as any);

    const req: any = { headers: { authorization: "Bearer tokenA" } };
    const res = mockRes();

    logout(req, res);
    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("logout returns 403 when db findById throws", async () => {
    jest.spyOn(jwt, "verify").mockImplementation((token: any, secret: any, cb: any) => {
      cb(null, { _id: "u1" });
      return {} as any;
    });
    jest.spyOn(UserModel, "findById").mockRejectedValueOnce(new Error("db fail"));

    const req: any = { headers: { authorization: "Bearer tokenA" } };
    const res = mockRes();

    logout(req, res);
    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("refreshToken returns 401 when header token missing", async () => {
    const req: any = { headers: {} };
    const res = mockRes();

    await refreshToken(req, res);

    expect(res.sendStatus).toHaveBeenCalledWith(401);
  });

  test("refreshToken returns 403 when jwt verify fails", async () => {
    jest.spyOn(jwt, "verify").mockImplementation((token: any, secret: any, cb: any) => {
      cb(new Error("bad"), null);
      return {} as any;
    });

    const req: any = { headers: { authorization: "Bearer bad" } };
    const res = mockRes();

    await refreshToken(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("refreshToken returns 403 when user not found", async () => {
    jest.spyOn(jwt, "verify").mockImplementation((token: any, secret: any, cb: any) => {
      cb(null, { _id: "u1" });
      return {} as any;
    });
    jest.spyOn(UserModel, "findById").mockResolvedValueOnce(null as any);

    const req: any = { headers: { authorization: "Bearer tokenA" } };
    const res = mockRes();

    await refreshToken(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("refreshToken returns 403 and clears tokens when token not in user list", async () => {
    jest.spyOn(jwt, "verify").mockImplementation((token: any, secret: any, cb: any) => {
      cb(null, { _id: "u1" });
      return {} as any;
    });

    const save = jest.fn().mockResolvedValue(undefined);
    jest.spyOn(UserModel, "findById").mockResolvedValueOnce({
      _id: "u1",
      tokens: ["other"],
      save,
    } as any);

    const req: any = { headers: { authorization: "Bearer tokenA" } };
    const res = mockRes();

    await refreshToken(req, res);
    await new Promise((resolve) => setImmediate(resolve));

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("refreshToken returns 403 when db findById throws", async () => {
    jest.spyOn(jwt, "verify").mockImplementation((token: any, secret: any, cb: any) => {
      cb(null, { _id: "u1" });
      return {} as any;
    });
    jest.spyOn(UserModel, "findById").mockRejectedValueOnce(new Error("db fail"));

    const req: any = { headers: { authorization: "Bearer tokenA" } };
    const res = mockRes();

    await refreshToken(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("googleLogin returns 500 when verification fails", async () => {
    (jest.spyOn(OAuth2Client.prototype as any, "verifyIdToken") as any).mockImplementationOnce(
      async () => {
        throw new Error("bad credential");
      }
    );

    const req: any = { body: { credential: "invalid" } };
    const res = mockRes();

    await googleLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("googleLogin creates new user and returns tokens", async () => {
    (jest.spyOn(OAuth2Client.prototype as any, "verifyIdToken") as any).mockImplementationOnce(
      async () => ({
        getPayload: () => ({ email: "new@test.com", picture: "pic.png" }),
      })
    );

    jest.spyOn(UserModel, "findOne").mockResolvedValueOnce(null as any);

    const save = jest.fn().mockResolvedValue(undefined);
    const createdUser: any = {
      _id: "u1",
      email: "new@test.com",
      username: "new",
      tokens: [],
      save,
    };
    jest.spyOn(UserModel, "create").mockResolvedValueOnce(createdUser);

    jest.spyOn(authUtils, "generateAndSaveTokens").mockResolvedValueOnce({
      accessToken: { token: "a", expireDate: new Date() as any },
      refreshToken: { token: "r", expireDate: new Date() as any },
      userTokens: ["r"],
    } as any);

    const req: any = { body: { credential: "valid" } };
    const res = mockRes();

    await googleLogin(req, res);

    expect(UserModel.create).toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
