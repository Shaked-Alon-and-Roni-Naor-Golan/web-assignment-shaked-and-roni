import * as express from "express";
import {
  getCommentById,
  getAllComments,
  getCommentByPostId,
  createComment,
  updateComment,
  deleteCommentById,
} from "../controllers/comments_controller";

const router = express.Router();

router.get("/", getAllComments);

router.get("/:commentId", getCommentById);

router.get("/post/:postId", getCommentByPostId);

router.post("/", createComment);

router.put("/:commentId", updateComment);

router.delete("/:commentId", deleteCommentById);

module.exports = router;
