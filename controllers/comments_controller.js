const CommentModel = require("../models/comments_model");

const getAllComments = async (req, res) => {
  const user = req.query.user;
  try {
    let comments;
    if (user) {
      comments = await CommentModel.find({ user });
    } else {
      comments = await CommentModel.find();
    }
    res.send(comments);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getCommentById = async (req, res) => {
  const commentId = req.params.commentId;

  try {
    const comment = await CommentModel.findById(commentId);
    if (comment) {
      res.send(comment);
    } else {
      res.status(404).send("Comment not found");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getCommentByPostId = async (req, res) => {
  const postId = req.params.postId;

  try {
    const comments = await CommentModel.find({ postId });
    if (comments.length > 0) {
      res.send(comments);
    } else {
      res.status(404).send("No comments found for post: " + postId);
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const createComment = async (req, res) => {
  const createdComment = req.body;
  try {
    const comment = await CommentModel.create(createdComment);
    res.status(201).send(comment);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const updateComment = async (req, res) => {
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

const deleteCommentById = async (req, res) => {
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

module.exports = {
  getAllComments,
  getCommentById,
  getCommentByPostId,
  createComment,
  updateComment,
  deleteCommentById,
};