import { Post } from "../dtos/post";
import { Request, Response } from "express";
import { deleteFile, uploadFile } from "../utils/multer";
import { PostModel } from "../models/posts_model";

const getAllPosts = async (req: Request, res: Response) => {
  try {
    const postOwner: string = String(req.query.postOwner ?? "");
    const offset: number = Number(req.query.offset ?? "0");
    let posts: Post[];

    if (postOwner) {
      posts = await PostModel.find({ owner: postOwner })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(3)
        .populate("owner", "-tokens -email -password")
        .populate("likedBy")
        .populate({ path: "comments", populate: { path: "user" } });
    } else {
      posts = await PostModel.find()
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(3)
        .populate("owner", "-tokens -email -password")
        .populate("likedBy")
        .populate({ path: "comments", populate: { path: "user" } });
    }

    res.send(posts);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getPostById = async (req: Request, res: Response) => {
  const postId: string = req.params.postId;

  try {
    const post: Post = await PostModel.findById(postId)
      .populate("owner", "-tokens -email -password")
      .populate("likedBy")
      .populate({ path: "comments", populate: { path: "user" } });
    if (post) {
      res.send(post);
    } else {
      res.status(404).send("Cannot find specified post");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const createPost = async (req: Request, res: Response) => {
  try {
    await uploadFile(req, res);
    const post: Post = JSON.parse(req.body.post);
    post.photoSrc = req.file.filename;
    await PostModel.create(post);

    res.status(201).send();
  } catch (error) {
    req.file?.filename && deleteFile(req.file.filename);
    res.status(500).send(error.message);
  }
};

const updatePost = async (req: Request, res: Response) => {
  try {
    await uploadFile(req, res);
    const postId: string = req.params.postId;

    const updatedPost: Post = JSON.parse(req.body.updatedPostContent);

    let oldPhoto: string;

    if (req.file?.filename) {
      updatedPost.photoSrc = req.file.filename;
      oldPhoto = (await PostModel.findById(postId)).photoSrc;
    }

    const newPost = await PostModel.findOneAndUpdate(
      { _id: postId },
      updatePost,
      { new: true }
    ).populate("owner");

    if (newPost) {
      if (oldPhoto) {
        deleteFile(oldPhoto);
      }
      res.status(201).send(newPost);
    } else {
      if (req.file?.filename) {
        deleteFile(req.file.filename);
      }
      res.status(404).send("Cannot find specified post");
    }
  } catch (error) {
    if (req.file?.filename) {
      deleteFile(req.file.filename);
    }
    res.status(500).send(error.message);
  }
};

const deletePostById = async (req: Request, res: Response) => {
  const postId = req.params.postId;

  try {
    const post = await PostModel.findByIdAndDelete(postId);

    if (post) {
      if (post.photoSrc) {
        deleteFile(post.photoSrc);
      }
      res.status(200).send("The post deleted");
    } else {
      res.status(404).send("Post not found");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export { getAllPosts, getPostById, createPost, updatePost, deletePostById };
