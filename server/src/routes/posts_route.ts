import * as express from "express";
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
} from "../controllers/posts_controller";

const router = express.Router();

router.get("/", getAllPosts);

router.get("/:postId", getPostById);

router.post("/", createPost);

router.put("/:postId", updatePost);

module.exports = router;
