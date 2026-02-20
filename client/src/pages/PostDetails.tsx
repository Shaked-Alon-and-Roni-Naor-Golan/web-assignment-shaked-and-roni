import { Post } from "../interfaces/post";
import { useParams } from "react-router-dom";
import PostComponent from "../components/Post";
import { createComment } from "../services/comment";
import PostComments from "../components/PostComments";
import { useUserContext } from "../context/UserContext";
import { usePostsContext } from "../context/PostsContext";
import { useEffect } from "react";

const PostDetails = () => {
  const { setPosts, posts, fetchPostById } = usePostsContext() ?? {};

  const { user } = useUserContext() ?? {};
  const { id } = useParams();
  useEffect(() => {
    if (id) {
      fetchPostById?.(id);
    }
  }, []);
  const post = id ? posts?.[id] : undefined;

  const onCommentAdd = (commentContent: string) => {
    if (user && post) {
      const newPost: Post = {
        ...post,
        comments: [{ content: commentContent, user }, ...post.comments],
      };
      updatePostInState(newPost);
      createComment(post._id, { content: commentContent, user: user });
    }
  };

  const updatePostInState = (newPost: Post) => {
    setPosts?.({
      ...posts,
      [newPost._id]: newPost,
    });
  };

  return post ? (
    <div>
      <div
        style={{
          width: "600px",
          height: "100%",
          padding: "15px",
          backgroundColor: "#F8F9FA",
        }}
      >
        <div className="d-flex justify-content-center align-items-center">
          <PostComponent post={post} showActionBar={true}></PostComponent>
        </div>
        <div className="d-flex justify-content-center align-items-center">
          <PostComments
            onCommentAdd={onCommentAdd}
            comments={post.comments}
          ></PostComments>
        </div>
      </div>
    </div>
  ) : (
    <div
      className="spinner-border text-success"
      style={{ width: "15rem", height: "15rem" }}
    />
  );
};

export default PostDetails;