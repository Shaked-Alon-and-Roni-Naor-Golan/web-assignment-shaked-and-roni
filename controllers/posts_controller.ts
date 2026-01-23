import { Request, Response } from "express";
import { Post } from "../dtos/post";
import { PostModel } from "../models/posts_model";

const getAllPosts = async (req: Request, res: Response) => {
  const postSender = String(req.query.postSender);

  try {
    let posts: Post[];
    if (postSender) {
      posts = await PostModel.find({ sender: postSender }); // TODO: add reference to users when created
    } else {
      posts = await PostModel.find();
    }

    res.send(posts);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getPostById = async (req: Request, res: Response) => {
  const postId: string = req.params.postId; // TODO: change the types

  try {
    const post: Post = await PostModel.findById(postId); // TODO: add reference to users when created
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
  try {
    const post: Post = await PostModel.create(createdPost);
    res.send(post);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const updatePost = async (req: Request, res: Response) => {
  const postId: string = req.params.postId; // TODO: change the types
  const updatedPostContent: Post = req.body;

  try {
    const result = await PostModel.updateOne(
      { _id: postId },
      updatedPostContent
    ); // TODO: add reference to users when created
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
