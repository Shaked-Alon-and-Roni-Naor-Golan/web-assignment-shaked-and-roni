import { useMemo, useState, useRef } from "react";
import { PostActionBar } from "./PostActionBar";
import { Post } from "../interfaces/post";
import { useNavigate } from "react-router-dom";
import { IMAGES_URL } from "../constants/files";
import { MdDeleteForever } from "react-icons/md";
import { MdEdit } from "react-icons/md";
import { AiFillLike } from "react-icons/ai";
import { useUserContext } from "../context/UserContext";
import { usePostsContext } from "../context/PostsContext";
import { deletePostById, updatePost } from "../services/posts";

interface PostProps {
  post: Post;
  isEditable?: boolean;
  showActionBar?: boolean;
}

const PostComponent = ({ post, isEditable, showActionBar }: PostProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(post.content);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useUserContext() ?? {};
  const { setPosts, posts } = usePostsContext() ?? {};
  const navigate = useNavigate();

  const onEditSave = async () => {
    const updatedPostData = await updatePost(post._id, { content: description, photo: newPhoto ?? undefined });
    
    if (updatedPostData) {
      updatePostInState(updatedPostData);
    }
  };

  const deletePost = () => {
    deletePostById(post._id);
    const tempPosts = { ...posts };
    delete tempPosts[post._id];
    setPosts?.(tempPosts);
  };

  const isLikedByCurrUser = useMemo(() => {
    return post.likedBy.some((currUser) => currUser?._id === user?._id);
  }, [post, user]);

  const onLikeToggle = () => {
    const prevPosts = posts;
    try {
      if (user) {
        let likedBy;
        if (isLikedByCurrUser) {
          likedBy = post.likedBy.filter(
            (currUser) => currUser._id !== user?._id
          );
        } else {
          likedBy = [user, ...post.likedBy];
        }
        const newPost: Post = {
          ...post,
          likedBy,
        };
        updatePostInState(newPost);
        // Send only the IDs to the server
        updatePost(post._id, { likedBy: likedBy.map((u) => u._id) as any });
      }
    } catch (error) {
      console.error(error);
      setPosts?.(prevPosts ?? {});
    }
  };

  const updatePostInState = (newPost: Post) => {
    setPosts?.((prevPosts) => ({ ...prevPosts, [newPost._id]: newPost }));
  };
  const handleSave = () => {
    onEditSave();
    setNewPhoto(null);
    setPhotoPreview(null);
    setIsEditing(false);
  };

  return (
    <div
      className="post mb-3"
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
      style={{
        width: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "white",
        display: "flex",
        justifyContent: "center",
      }}
    >
      {isHovered && user?._id === post.owner._id && (
        <div
          className="edit-buttons"
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            display: "flex",
            gap: "10px",
          }}
        >
          {showActionBar && !isEditing && isEditable && (
            <button
              className="btn btn-light"
              style={{ border: "none", background: "transparent" }}
              onClick={() => setIsEditing(true)}
            >
              <MdEdit size={20} />
            </button>
          )}
          {deletePost && isEditable && (
            <button
              className="btn btn-light"
              style={{ border: "none", background: "transparent" }}
              onClick={deletePost}
            >
              <MdDeleteForever size={30} />
            </button>
          )}
        </div>
      )}

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

        {isEditing ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-control mb-3"
              style={{ height: "40px", resize: "none" }}
            />
            <div 
              style={{
                position: "relative",
                cursor: "pointer",
                marginBottom: "10px"
              }}
              onClick={() => fileInputRef.current?.click()}
              title="Click to change image"
            >
              <img
                src={photoPreview || IMAGES_URL + post.photoSrc}
                alt="Post"
                height="200px"
                className="img-fluid"
                style={{
                  opacity: 0.8,
                  transition: "opacity 0.2s"
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "5px",
                  fontSize: "12px"
                }}
              >
                Click to change image
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setNewPhoto(file);
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setPhotoPreview(event.target?.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <button className="btn btn-dark mt-1" onClick={handleSave}>
              Save
            </button>
          </div>
        ) : (
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
          </div>
        )}

        {showActionBar && (
          <PostActionBar
            postId={post._id}
            comments={post.comments}
            likesNumber={post.likedBy.length}
            likedByUser={isLikedByCurrUser}
            key={post._id}
            onLikeToggle={onLikeToggle}
          ></PostActionBar>
        )}
        
        {!showActionBar && user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              marginTop: "8px",
              paddingTop: "8px",
              borderTop: "1px solid #eee",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <button
                className={`btn btn-light ${
                  isLikedByCurrUser ? "text-danger" : "text-secondary"
                }`}
                onClick={onLikeToggle}
                style={{ border: "none", background: "transparent", padding: "8px" }}
                title={isLikedByCurrUser ? "Unlike" : "Like"}
              >
                <AiFillLike size={20} />
              </button>
              <span className="ml-2">{post.likedBy.length} Likes</span>
            </div>
            <span style={{ cursor: "pointer" }} onClick={() => navigate(`/post/${post._id}`)}>
              {post.comments.length} Comments
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostComponent;