import { useState } from "react";
import { IMAGES_URL } from "../constants/files";
import { PostComment } from "../interfaces/comment";

interface PostCommentsProps {
  comments: PostComment[];
  onCommentAdd: (commentContent: string) => void;
}

const PostComments = ({ comments, onCommentAdd }: PostCommentsProps) => {
  const [newCommentContent, setNewCommentContent] = useState("");

  const handleAddComment = () => {
    if (newCommentContent.trim() !== "") {
      onCommentAdd(newCommentContent);
      setNewCommentContent("");
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <div className="mt-1">
        <div className="d-flex align-items-center my-3">
          <input
            type="text"
            className="form-control"
            placeholder="Comment something..."
            value={newCommentContent}
            onChange={(e) => setNewCommentContent(e.target.value)}
          />
          <button className="btn btn-dark m-1" onClick={handleAddComment}>
            Comment!
          </button>
        </div>
        <ul className="list-group">
          {comments.map((comment) => (
            <li className="list-group-item" key={comment.content}>
              <div
                className="d-flex align-items-center mb-1"
                style={{ direction: "rtl" }}
              >
                <img
                  src={
                    comment.user.photo
                      ? comment.user.photo.startsWith("http")
                        ? comment.user.photo
                        : IMAGES_URL + comment.user.photo
                      : "/temp-user.png"
                  }
                  alt={comment.user.username}
                  className="rounded-circle user-photo my-1 mx-2"
                  style={{ width: "15px", height: "15px" }}
                />
                <span>{comment.content}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PostComments;