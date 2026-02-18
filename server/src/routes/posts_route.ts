import * as express from "express";
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePostById,
} from "../controllers/posts_controller";

const router = express.Router();

router.get("/", getAllPosts);

router.get("/:postId", getPostById);

router.post("/", createPost);

router.put("/:postId", updatePost);

router.delete("/:postId", deletePostById);

module.exports = router;
