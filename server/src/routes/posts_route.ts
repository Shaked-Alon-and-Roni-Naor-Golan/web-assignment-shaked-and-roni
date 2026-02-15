import { Router } from "express";
const router = Router();
import {
    getAllPosts,
    getPostById,
    createPost,
    updatePost,
  } from "../controllers/posts_controller";

router.get("/", getAllPosts);

router.get("/:postId", getPostById);

router.post("/", createPost);

router.put("/:postId", updatePost);

module.exports = router;