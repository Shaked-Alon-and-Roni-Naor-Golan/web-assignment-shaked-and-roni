import { Request, Response } from "express";
import { CommentModel } from "../models/comments_model";
import { Comment } from "../dtos/comment";
import { PostModel } from "../models/posts_model";

const getAllComments = async (req: Request, res: Response) => {
  const userId: string = String(req.query.user || "");

  try {
    let comments: Comment[];

    if (userId) {
      comments = await CommentModel.find({ user: userId }).populate(
        "post",
        "user"
      );
    } else {
      comments = await CommentModel.find().populate("post", "user");
    }
    res.send(comments);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getCommentById = async (req: Request, res: Response) => {
  const commentId: string = req.params.commentId;

  try {
    const comment: Comment = await CommentModel.findById(commentId).populate(
      "post",
      "user"
    );
    if (comment) {
      res.send(comment);
    } else {
      res.status(404).send("Comment not found");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const createComment = async (req: Request, res: Response) => {
  const { postId, comment } = req.body;

  try {
    const newComment = await CommentModel.create(comment);
    await PostModel.updateOne(
      { _id: postId },
      { $push: { comments: newComment._id } }
    );
    res.status(201).send(newComment);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const updateComment = async (req: Request, res: Response) => {
  const commentId = req.params.commentId;
  const updatedComment = req.body;

  try {
    const result = await CommentModel.updateOne(
      { _id: commentId },
      updatedComment
    );
    if (result.modifiedCount > 0) {
      res.status(201).send();
    } else {
      res.status(404).send("comment not found");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const deleteCommentById = async (req: Request, res: Response) => {
  const commentId = req.params.commentId;

  try {
    const comment = await CommentModel.deleteOne({ _id: commentId });
    if (comment.deletedCount > 0) {
      res.status(200).send("The comment deleted");
    } else {
      res.status(404).send("Comment not found");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export {
  getAllComments,
  getCommentById,
  createComment,
  updateComment,
  deleteCommentById,
};
