const PostModel = require("../models/posts_model");

const getAllPosts = async (req, res) => {
  const postSender = req.query.postSender;

  try {
    let posts;
    if (postSender) {
      posts = await PostModel.find({ sender: postSender });
    } else {
      posts = await PostModel.find();
    }

    res.send(posts);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getPostById = async (req, res) => {
  const postId = req.params.postId;

  try {
    const post = await PostModel.findById(postId);
    if (post) {
      res.send(post);
    } else {
      res.status(404).send("Cannot find specified post");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const createPost = async (req, res) => {
  const createdPost = req.body;
  try {
    const post = await PostModel.create(createdPost);
    res.send(post);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const updatePost = async (req, res) => {
  const postId = req.params.postId;
  const updatedPostContent = req.body;

  try {
    const result = await PostModel.updateOne(
      { _id: postId },
      updatedPostContent
    );
    if (result.modifiedCount > 0) {
      res.status(201).send();
    } else {
      res.status(404).send("Cannot find specified post");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
};
