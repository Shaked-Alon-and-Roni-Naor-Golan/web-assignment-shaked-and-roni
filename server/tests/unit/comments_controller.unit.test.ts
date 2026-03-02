import {
  getAllComments,
  getCommentById,
  createComment,
  updateComment,
  deleteCommentById,
} from "../../src/controllers/comments_controller";
import { CommentModel } from "../../src/models/comments_model";
import { PostModel } from "../../src/models/posts_model";

describe("comments_controller unit", () => {
  const mockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("getAllComments returns 500 on db error", async () => {
    jest.spyOn(CommentModel, "find").mockImplementationOnce(() => {
      throw new Error("db error");
    });

    const req: any = { query: {} };
    const res = mockRes();

    await getAllComments(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("getCommentById returns 500 on db error", async () => {
    jest.spyOn(CommentModel, "findById").mockImplementationOnce(() => {
      throw new Error("db error");
    });

    const req: any = { params: { commentId: "bad" } };
    const res = mockRes();

    await getCommentById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("getCommentById sends comment when found", async () => {
    const foundComment = { _id: "c1", content: "ok" };
    const query: any = {
      populate: jest.fn().mockResolvedValue(foundComment),
    };
    jest.spyOn(CommentModel, "findById").mockReturnValueOnce(query);

    const req: any = { params: { commentId: "c1" } };
    const res = mockRes();

    await getCommentById(req, res);

    expect(res.send).toHaveBeenCalledWith(foundComment);
  });

  test("createComment returns 500 when create fails", async () => {
    jest.spyOn(CommentModel, "create").mockRejectedValueOnce(new Error("create failed"));

    const req: any = {
      body: { postId: "p1", comment: { user: "u1", content: "x" } },
    };
    const res = mockRes();

    await createComment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("updateComment returns 404 when no rows modified", async () => {
    jest.spyOn(CommentModel, "updateOne").mockResolvedValueOnce({ modifiedCount: 0 } as any);

    const req: any = { params: { commentId: "c1" }, body: { content: "new" } };
    const res = mockRes();

    await updateComment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("comment not found");
  });

  test("updateComment returns 500 on update error", async () => {
    jest.spyOn(CommentModel, "updateOne").mockRejectedValueOnce(new Error("update fail"));

    const req: any = { params: { commentId: "c1" }, body: { content: "new" } };
    const res = mockRes();

    await updateComment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("deleteCommentById returns 404 when comment does not exist", async () => {
    jest.spyOn(CommentModel, "deleteOne").mockResolvedValueOnce({ deletedCount: 0 } as any);

    const req: any = { params: { commentId: "c1" } };
    const res = mockRes();

    await deleteCommentById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("Comment not found");
  });

  test("deleteCommentById returns 500 on db error", async () => {
    jest.spyOn(CommentModel, "deleteOne").mockRejectedValueOnce(new Error("db error"));

    const req: any = { params: { commentId: "c1" } };
    const res = mockRes();

    await deleteCommentById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
