const express = require("express");
import {
    getAllPosts,
    getPostById,
    createPost,
    updatePost,
  } from "../../server/controllers/posts_controller";

const router = express.Router();

router.get("/", getAllPosts);

router.get("/:postId", getPostById);

router.post("/", createPost);

router.put("/:postId", updatePost);

module.exports = router;