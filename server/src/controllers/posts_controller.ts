import { Request, Response } from "express";
import { Post } from "../dtos/post";
import { PostModel } from "../models/posts_model";

const getAllPosts = async (req: Request, res: Response) => {
  const postOwner = req.query.postOwner;

  try {
    let posts: Post[];
    if (postOwner) {
      posts = await PostModel.find({ owner: String(postOwner) }).populate(
        "owner"
      );
    } else {
      posts = await PostModel.find().populate("owner");
    }

    res.send(posts);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getPostById = async (req: Request, res: Response) => {
  const postId: string = req.params.postId;

  try {
    const post: Post = await PostModel.findById(postId).populate("owner");
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
  const createdPost: Post = req.body;
  console.log(createdPost);
  try {
    const post: Post = await PostModel.create(createdPost);
    res.send(post);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const updatePost = async (req: Request, res: Response) => {
  const postId: string = req.params.postId;
  const updatedPostContent: Post = req.body;

  try {
    const result = await PostModel.updateOne(
      { _id: postId },
      updatedPostContent
    ).populate("owner");
    if (result.modifiedCount > 0) {
      res.status(201).send();
    } else {
      res.status(404).send("Cannot find specified post");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export { getAllPosts, getPostById, createPost, updatePost };
