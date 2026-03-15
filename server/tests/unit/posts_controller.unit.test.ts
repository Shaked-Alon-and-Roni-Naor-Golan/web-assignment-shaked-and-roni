import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePostById,
} from "../../src/controllers/posts_controller";
import { PostModel } from "../../src/models/posts_model";
import * as multerUtils from "../../src/utils/multer";
import postSearchService from "../../src/services/post_search_service";

describe("posts_controller unit", () => {
  const mockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("getAllPosts returns 500 on db error", async () => {
    jest
      .spyOn(postSearchService, "searchPosts")
      .mockRejectedValueOnce(new Error("db fail"));

    const req: any = { query: {} };
    const res = mockRes();

    await getAllPosts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("getAllPosts sends service results", async () => {
    const posts = [{ _id: "p1" }, { _id: "p2" }];
    jest.spyOn(postSearchService, "searchPosts").mockResolvedValueOnce(posts as any);

    const req: any = {
      query: { postOwner: "owner-1", offset: "2", q: "tel aviv" },
    };
    const res = mockRes();

    await getAllPosts(req, res);

    expect(postSearchService.searchPosts).toHaveBeenCalledWith({
      query: "tel aviv",
      ownerId: "owner-1",
      offset: 2,
      limit: 3,
    });
    expect(res.send).toHaveBeenCalledWith(posts);
  });

  test("getPostById returns 500 on db error", async () => {
    jest.spyOn(PostModel, "findById").mockImplementationOnce(() => {
      throw new Error("db fail");
    });

    const req: any = { params: { postId: "bad" } };
    const res = mockRes();

    await getPostById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("getPostById sends post when found", async () => {
    const post = { _id: "p1", content: "ok" };
    const query: any = {};
    query.populate = jest
      .fn()
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(post);
    jest.spyOn(PostModel, "findById").mockReturnValueOnce(query);

    const req: any = { params: { postId: "p1" } };
    const res = mockRes();

    await getPostById(req, res);

    expect(res.send).toHaveBeenCalledWith(post);
  });

  test("getPostById returns 404 when not found", async () => {
    const query: any = {};
    query.populate = jest
      .fn()
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(null);
    jest.spyOn(PostModel, "findById").mockReturnValueOnce(query);

    const req: any = { params: { postId: "p1" } };
    const res = mockRes();

    await getPostById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("createPost returns 500 when body.post is invalid JSON", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockResolvedValueOnce();

    const req: any = {
      body: { post: "not-json" },
      file: { filename: "tmp.jpg" },
    };
    const res = mockRes();
    const delSpy = jest.spyOn(multerUtils, "deleteFile").mockImplementation(() => {});

    await createPost(req, res);

    expect(delSpy).toHaveBeenCalledWith("tmp.jpg");
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("createPost returns 201 on success", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockResolvedValueOnce();
    const createSpy = jest
      .spyOn(PostModel, "create")
      .mockResolvedValueOnce({ _id: "p1" } as any);

    const populated = { _id: "p1", content: "hi" };
    const query: any = {};
    query.populate = jest
      .fn()
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(populated);
    jest.spyOn(PostModel, "findById").mockReturnValueOnce(query);

    const req: any = {
      body: { post: JSON.stringify({ owner: "u1", content: "hi" }) },
      file: { filename: "img.jpg" },
    };
    const res = mockRes();

    await createPost(req, res);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        photoSrc: "img.jpg",
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(populated);
  });

  test("createPost normalizes city and numeric fields", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockResolvedValueOnce();
    const createSpy = jest
      .spyOn(PostModel, "create")
      .mockResolvedValueOnce({ _id: "p1" } as any);

    const populated = { _id: "p1", content: "hi" };
    const query: any = {};
    query.populate = jest
      .fn()
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(populated);
    jest.spyOn(PostModel, "findById").mockReturnValueOnce(query);

    const req: any = {
      body: {
        post: JSON.stringify({
          owner: "u1",
          content: "hi",
          city: "  Eilat  ",
          pricePerNight: "450",
          nights: "2",
        }),
      },
      file: { filename: "img.jpg" },
    };
    const res = mockRes();

    await createPost(req, res);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        city: "Eilat",
        pricePerNight: 450,
        nights: 2,
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("createPost sets undefined for blank city and invalid numbers", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockResolvedValueOnce();
    const createSpy = jest
      .spyOn(PostModel, "create")
      .mockResolvedValueOnce({ _id: "p1" } as any);

    const query: any = {};
    query.populate = jest
      .fn()
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockReturnValueOnce({ _id: "p1" });
    jest.spyOn(PostModel, "findById").mockReturnValueOnce(query);

    const req: any = {
      body: {
        post: JSON.stringify({
          owner: "u1",
          content: "hi",
          city: "   ",
          pricePerNight: "abc",
          nights: "",
        }),
      },
      file: { filename: "img.jpg" },
    };
    const res = mockRes();

    await createPost(req, res);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        city: undefined,
        pricePerNight: "abc",
        nights: "",
      })
    );
  });

  test("updatePost returns 404 when post not found", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockResolvedValueOnce();
    jest.spyOn(PostModel, "findById").mockResolvedValueOnce(null as any);

    const req: any = {
      params: { postId: "p1" },
      body: {},
      file: { filename: "tmp.jpg" },
      user: { _id: "u1" },
    };
    const res = mockRes();
    const delSpy = jest.spyOn(multerUtils, "deleteFile").mockImplementation(() => {});

    await updatePost(req, res);

    expect(delSpy).toHaveBeenCalledWith("tmp.jpg");
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("updatePost returns 403 and deletes uploaded file for non-owner content update", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockResolvedValueOnce();
    jest.spyOn(PostModel, "findById").mockResolvedValueOnce({
      owner: { toString: () => "owner-1" },
      likedBy: [],
      photoSrc: "old.jpg",
    } as any);
    const delSpy = jest.spyOn(multerUtils, "deleteFile").mockImplementation(() => {});

    const req: any = {
      params: { postId: "p1" },
      body: { updatedPostContent: JSON.stringify({ content: "new" }) },
      file: { filename: "new.jpg" },
      user: { _id: "owner-2" },
    };
    const res = mockRes();

    await updatePost(req, res);

    expect(delSpy).toHaveBeenCalledWith("new.jpg");
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("updatePost updates non-like content path and deletes old photo", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockResolvedValueOnce();
    jest.spyOn(PostModel, "findById").mockResolvedValueOnce({
      owner: { toString: () => "owner-1" },
      likedBy: [],
      photoSrc: "old.jpg",
    } as any);

    const updatedDoc = { _id: "p1", content: "new" };
    const query: any = {};
    query.populate = jest
      .fn()
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(updatedDoc);
    jest.spyOn(PostModel, "findByIdAndUpdate").mockReturnValueOnce(query);
    const delSpy = jest.spyOn(multerUtils, "deleteFile").mockImplementation(() => {});

    const req: any = {
      params: { postId: "p1" },
      body: { updatedPostContent: JSON.stringify({ content: "new" }) },
      file: { filename: "new.jpg" },
      user: { _id: "owner-1" },
    };
    const res = mockRes();

    await updatePost(req, res);

    expect(delSpy).toHaveBeenCalledWith("old.jpg");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("updatePost supports req.body direct fields without updatedPostContent", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockResolvedValueOnce();
    jest.spyOn(PostModel, "findById").mockResolvedValueOnce({
      owner: { toString: () => "owner-1" },
      likedBy: [],
      photoSrc: "old.jpg",
    } as any);

    const updatedDoc = { _id: "p1", content: "new" };
    const query: any = {};
    query.populate = jest
      .fn()
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(updatedDoc);
    const updateSpy = jest.spyOn(PostModel, "findByIdAndUpdate").mockReturnValueOnce(query);

    const req: any = {
      params: { postId: "p1" },
      body: {
        city: "  Haifa ",
        pricePerNight: "500",
        nights: "4",
      },
      user: { _id: "owner-1" },
    };
    const res = mockRes();

    await updatePost(req, res);

    expect(updateSpy).toHaveBeenCalledWith(
      "p1",
      {
        $set: {
          city: "Haifa",
          pricePerNight: 500,
          nights: 4,
        },
      },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("updatePost toggles like on when user not yet in likedBy", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockResolvedValueOnce();
    jest.spyOn(PostModel, "findById").mockResolvedValueOnce({
      owner: { toString: () => "owner-1" },
      likedBy: ["other-user"],
      photoSrc: "old.jpg",
    } as any);

    const updatedDoc = { _id: "p1", likedBy: ["other-user", "user-1"] };
    const query: any = {};
    query.populate = jest
      .fn()
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(updatedDoc);
    const updateSpy = jest.spyOn(PostModel, "findByIdAndUpdate").mockReturnValueOnce(query);

    const req: any = {
      params: { postId: "p1" },
      body: { updatedPostContent: JSON.stringify({ userId: "507f1f77bcf86cd799439011" }) },
      user: { _id: "owner-2" },
    };
    const res = mockRes();

    await updatePost(req, res);

    expect(updateSpy).toHaveBeenCalledWith(
      "p1",
      { $addToSet: { likedBy: expect.any(Object) } },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(updatedDoc);
  });

  test("updatePost toggles like off when user already liked", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockResolvedValueOnce();
    jest.spyOn(PostModel, "findById").mockResolvedValueOnce({
      owner: { toString: () => "owner-1" },
      likedBy: ["507f1f77bcf86cd799439011"],
      photoSrc: "old.jpg",
    } as any);

    const updatedDoc = { _id: "p1", likedBy: [] };
    const query: any = {};
    query.populate = jest
      .fn()
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(updatedDoc);
    const updateSpy = jest.spyOn(PostModel, "findByIdAndUpdate").mockReturnValueOnce(query);

    const req: any = {
      params: { postId: "p1" },
      body: { updatedPostContent: JSON.stringify({ userId: "507f1f77bcf86cd799439011" }) },
      user: { _id: "owner-2" },
    };
    const res = mockRes();

    await updatePost(req, res);

    expect(updateSpy).toHaveBeenCalledWith(
      "p1",
      { $pull: { likedBy: expect.any(Object) } },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(updatedDoc);
  });

  test("updatePost like toggle handles undefined likedBy array", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockResolvedValueOnce();
    jest.spyOn(PostModel, "findById").mockResolvedValueOnce({
      owner: { toString: () => "owner-1" },
      photoSrc: "old.jpg",
    } as any);

    const updatedDoc = { _id: "p1", likedBy: ["507f1f77bcf86cd799439011"] };
    const query: any = {};
    query.populate = jest
      .fn()
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(updatedDoc);
    const updateSpy = jest.spyOn(PostModel, "findByIdAndUpdate").mockReturnValueOnce(query);

    const req: any = {
      params: { postId: "p1" },
      body: { updatedPostContent: JSON.stringify({ userId: "507f1f77bcf86cd799439011" }) },
      user: { _id: "owner-2" },
    };
    const res = mockRes();

    await updatePost(req, res);

    expect(updateSpy).toHaveBeenCalledWith(
      "p1",
      { $addToSet: { likedBy: expect.any(Object) } },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(updatedDoc);
  });

  test("updatePost returns 404 when update query resolves null", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockResolvedValueOnce();
    jest.spyOn(PostModel, "findById").mockResolvedValueOnce({
      owner: { toString: () => "owner-1" },
      likedBy: [],
      photoSrc: "old.jpg",
    } as any);

    const query: any = {};
    query.populate = jest
      .fn()
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(query)
      .mockReturnValueOnce(null);
    jest.spyOn(PostModel, "findByIdAndUpdate").mockReturnValueOnce(query);

    const delSpy = jest.spyOn(multerUtils, "deleteFile").mockImplementation(() => {});
    const req: any = {
      params: { postId: "p1" },
      body: { updatedPostContent: JSON.stringify({ content: "new" }) },
      file: { filename: "new.jpg" },
      user: { _id: "owner-1" },
    };
    const res = mockRes();

    await updatePost(req, res);

    expect(delSpy).toHaveBeenCalledWith("new.jpg");
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("updatePost returns 500 and deletes uploaded file on unexpected error", async () => {
    jest.spyOn(multerUtils, "uploadFile").mockRejectedValueOnce(new Error("upload fail"));
    const delSpy = jest.spyOn(multerUtils, "deleteFile").mockImplementation(() => {});

    const req: any = {
      params: { postId: "p1" },
      body: {},
      file: { filename: "tmp.jpg" },
      user: { _id: "u1" },
    };
    const res = mockRes();

    await updatePost(req, res);

    expect(delSpy).toHaveBeenCalledWith("tmp.jpg");
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("deletePostById returns 500 on db error", async () => {
    jest.spyOn(PostModel, "findByIdAndDelete").mockRejectedValueOnce(new Error("db fail"));

    const req: any = { params: { postId: "p1" } };
    const res = mockRes();

    await deletePostById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("deletePostById returns 404 when post missing", async () => {
    jest.spyOn(PostModel, "findByIdAndDelete").mockResolvedValueOnce(null as any);

    const req: any = { params: { postId: "p1" } };
    const res = mockRes();

    await deletePostById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("Post not found");
  });

  test("deletePostById deletes file and returns 200 when post exists", async () => {
    jest.spyOn(PostModel, "findByIdAndDelete").mockResolvedValueOnce({
      photoSrc: "post.jpg",
    } as any);
    const delSpy = jest.spyOn(multerUtils, "deleteFile").mockImplementation(() => {});

    const req: any = { params: { postId: "p1" } };
    const res = mockRes();

    await deletePostById(req, res);

    expect(delSpy).toHaveBeenCalledWith("post.jpg");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith("The post deleted");
  });
});
