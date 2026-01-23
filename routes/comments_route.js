const express = require("express");
const commentsController = require("../controllers/comments_controller");

const router = express.Router();

router.get("/", commentsController.getAllComments);

router.get("/:commentId", commentsController.getCommentById);

router.get("/post/:postId", commentsController.getCommentByPostId);

router.post("/", commentsController.createComment);

router.put("/:commentId", commentsController.updateComment);

router.delete("/:commentId", commentsController.deleteCommentById);

module.exports = router;