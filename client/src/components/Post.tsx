import { useMemo, useState } from "react";
import { Post } from "../interfaces/post";
import { StarRating } from "./StarRating";
import { useNavigate } from "react-router-dom";
import { IMAGES_URL } from "../constants/files";
import { useUserContext } from "../context/UserContext";
import { usePostsContext } from "../context/PostsContext";
import { updatePost } from "../services/posts";

interface PostProps {
  post: Post;
  enableChanges?: boolean;
  enablePostActions?: boolean;
}

const PostComponent = ({
  post,
  enableChanges,
  enablePostActions,
}: PostProps) => {
  const [description, setDescription] = useState(post.content);
  const [rating, setRating] = useState(post.rating);

  const { user } = useUserContext() ?? {};
  const { setPosts, posts } = usePostsContext() ?? {};
  const navigate = useNavigate();

  return (
    <div
      className="post mb-3"
      style={{
        width: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "white",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        className="card-body d-flex justify-content-center row"
        style={{ padding: "1rem" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "5px",
          }}
        >
          <img
            src={
              post.owner.photo
                ? post.owner.photo.startsWith("http")
                  ? post.owner.photo
                  : IMAGES_URL + post.owner.photo
                : "/temp-user.png"
            }
            alt={post.owner.username}
            className="rounded-circle user-photo m-2"
            style={{ width: "30px", height: "30px" }}
          />
          <span className="ml-3">
            <b>{post.owner.username}</b>
          </span>
        </div>

        <div
          onClick={() => {
            navigate(`/post/${post._id}`);
          }}
          style={{
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
          className="hover-shadow"
        >
          <p className="text-center">{description}</p>
          <img
            src={IMAGES_URL + post.photoSrc}
            alt="Post"
            className="img-fluid mb-1"
          />
          <StarRating rating={rating} onRatingChanged={() => {}} />
        </div>
      </div>
    </div>
  );
};

export default PostComponent;
