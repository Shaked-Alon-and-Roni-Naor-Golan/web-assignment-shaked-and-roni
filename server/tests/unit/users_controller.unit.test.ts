import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUserById,
  getCurrentUser,
} from "../../src/controllers/users_controller";
import { UserModel } from "../../src/models/user_model";
import * as userService from "../../src/services/user_service";
import * as multerUtils from "../../src/utils/multer";

describe("users_controller unit", () => {
  const mockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("getAllUsers returns 500 when model throws", async () => {
    jest.spyOn(UserModel, "find").mockRejectedValueOnce(new Error("db fail"));
    const req: any = {};
    const res = mockRes();

    await getAllUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("getAllUsers sends users on success", async () => {
    const users = [{ _id: "u1" }];
    jest.spyOn(UserModel, "find").mockResolvedValueOnce(users as any);
    const req: any = {};
    const res = mockRes();

    await getAllUsers(req, res);

    expect(res.send).toHaveBeenCalledWith(users);
  });

  test("getUserById returns 404 when user missing", async () => {
    jest.spyOn(userService, "findUserById").mockResolvedValueOnce(null as any);
    const req: any = { params: { userId: "u1" } };
    const res = mockRes();

    await getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("getUserById sends user on success", async () => {
    const user = { _id: "u1", username: "ok" };
    jest.spyOn(userService, "findUserById").mockResolvedValueOnce(user as any);
    const req: any = { params: { userId: "u1" } };
    const res = mockRes();

    await getUserById(req, res);

    expect(res.send).toHaveBeenCalledWith(user);
  });

  test("getUserById returns 500 when service throws", async () => {
    jest.spyOn(userService, "findUserById").mockRejectedValueOnce(new Error("fail"));
    const req: any = { params: { userId: "u1" } };
    const res = mockRes();

    await getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("createUser returns 500 when service throws", async () => {
    jest.spyOn(userService, "createNewUser").mockRejectedValueOnce(new Error("create failed"));
    const req: any = { body: { username: "x" } };
    const res = mockRes();

    await createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("createUser sends 201 on success", async () => {
    const created = { _id: "u1", username: "x" };
    jest.spyOn(userService, "createNewUser").mockResolvedValueOnce(created as any);
    const req: any = { body: { username: "x" } };
    const res = mockRes();

    await createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(created);
  });

  test("updateUser returns 400 when username already exists", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockResolvedValueOnce();
    jest.spyOn(UserModel, "findOne").mockResolvedValueOnce({ _id: "other" } as any);

    const req: any = { params: { userId: "u1" }, body: { username: "dup" }, file: null };
    const res = mockRes();

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Username already exists");
  });

  test("updateUser returns 404 when current user not found", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockResolvedValueOnce();
    jest.spyOn(UserModel, "findOne").mockResolvedValueOnce(null as any);
    jest.spyOn(UserModel, "findById").mockResolvedValueOnce(null as any);

    const req: any = {
      params: { userId: "u1" },
      body: { username: "ok" },
      file: { filename: "tmp.jpg" },
    };
    const res = mockRes();
    const deleteSpy = jest.spyOn(multerUtils, "deleteFile").mockImplementation(() => {});

    await updateUser(req, res);

    expect(deleteSpy).toHaveBeenCalledWith("tmp.jpg");
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("updateUser returns 404 when findOneAndUpdate returns null", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockResolvedValueOnce();
    jest.spyOn(UserModel, "findOne").mockResolvedValueOnce(null as any);
    jest.spyOn(UserModel, "findById").mockResolvedValueOnce({ _id: "u1", photo: "old.jpg" } as any);
    jest.spyOn(UserModel, "findOneAndUpdate").mockResolvedValueOnce(null as any);
    const deleteSpy = jest.spyOn(multerUtils, "deleteFile").mockImplementation(() => {});

    const req: any = {
      params: { userId: "u1" },
      body: { username: "ok" },
      file: { filename: "new.jpg" },
    };
    const res = mockRes();

    await updateUser(req, res);

    expect(deleteSpy).toHaveBeenCalledWith("new.jpg");
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("updateUser returns 500 on unexpected error", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockRejectedValueOnce(new Error("upload fail"));
    const deleteSpy = jest.spyOn(multerUtils, "deleteFile").mockImplementation(() => {});

    const req: any = {
      params: { userId: "u1" },
      body: { username: "ok" },
      file: { filename: "new.jpg" },
    };
    const res = mockRes();

    await updateUser(req, res);

    expect(deleteSpy).toHaveBeenCalledWith("new.jpg");
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("deleteUserById returns 404 when nothing deleted", async () => {
    jest.spyOn(UserModel, "deleteOne").mockResolvedValueOnce({ deletedCount: 0 } as any);

    const req: any = { params: { userId: "u1" } };
    const res = mockRes();

    await deleteUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("deleteUserById returns 201 when deleted", async () => {
    jest.spyOn(UserModel, "deleteOne").mockResolvedValueOnce({ deletedCount: 1 } as any);

    const req: any = { params: { userId: "u1" } };
    const res = mockRes();

    await deleteUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("deleteUserById returns 500 on db error", async () => {
    jest.spyOn(UserModel, "deleteOne").mockRejectedValueOnce(new Error("db fail"));

    const req: any = { params: { userId: "u1" } };
    const res = mockRes();

    await deleteUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("getCurrentUser catch branch returns 500 if res.send throws", async () => {
    const req: any = { user: { _id: "u1" } };
    const res: any = {};
    res.send = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("send fail");
      })
      .mockReturnValue(res);
    res.status = jest.fn().mockReturnValue(res);

    await getCurrentUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
