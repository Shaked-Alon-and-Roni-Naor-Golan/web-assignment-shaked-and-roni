const express = require("express");
const postsController = require("../controllers/posts_controller");

const router = express.Router();

router.get("/", postsController.getAllPosts);

router.get("/:postId", postsController.getPostById);

router.post("/", postsController.createPost);

router.put("/:postId", postsController.updatePost);

module.exports = router;
