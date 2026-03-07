import { AiFillLike } from "react-icons/ai";
import { PostComment } from "../interfaces/comment";
import { useNavigate } from "react-router-dom";

interface PostActionBarProps {
  postId: string;
  likesNumber: number;
  likedByUser: boolean;
  comments: PostComment[];
  onLikeToggle: () => void;
}

export const PostActionBar: React.FC<PostActionBarProps> = ({
  postId,
  likesNumber,
  likedByUser,
  comments,
  onLikeToggle,
}) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div className="d-flex align-items-center mb-1">
        <button
          className={`btn btn-light ${
            likedByUser ? "text-danger" : "text-secondary"
          }`}
          onClick={onLikeToggle}
          style={{ border: "none", background: "transparent", padding: "8px" }}
        >
          <AiFillLike size={20} />
        </button>
        <span className="ml-1">{likesNumber} Likes</span>
      </div>

      <div
        className="mb-1"
        style={{
          cursor: window.location.pathname === "/" ? "pointer" : "default",
        }}
        onClick={() => {
          if (window.location.pathname === "/") {
            navigate(`/post/${postId}`);
          }
        }}
      >
        <span>{comments.length} Comments</span>
      </div>
    </div>
  );
};