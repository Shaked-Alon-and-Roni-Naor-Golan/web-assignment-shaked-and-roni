import { Request, Response } from "express";
import { CommentModel } from "../models/comments_model";
import { Comment } from "../dtos/comment";

const getAllComments = async (req: Request, res: Response) => {
  const userId = req.query.user;
  try {
    let comments: Comment[];
    if (userId) {
      comments = await CommentModel.find({ user: String(userId) }).populate(
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

const getCommentByPostId = async (req: Request, res: Response) => {
  const postId: string = req.params.postId;

  try {
    const comments: Comment[] = await CommentModel.find({ post: postId });
    if (comments.length > 0) {
      res.send(comments);
    } else {
      res.status(404).send("No comments found for post: " + postId);
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const createComment = async (req: Request, res: Response) => {
  const createdComment = req.body;
  try {
    const comment = await CommentModel.create(createdComment);
    res.status(201).send(comment);
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
  getCommentByPostId,
  createComment,
  updateComment,
  deleteCommentById,
};
