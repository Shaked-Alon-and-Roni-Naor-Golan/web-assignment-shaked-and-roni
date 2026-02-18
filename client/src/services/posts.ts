import { CreatePostPayload, Post, UpdatePostPayload } from "../interfaces/post";
import { createAxiosInstance } from "../config/axiosInstance";

const axiosInstance = createAxiosInstance(
  `${import.meta.env.VITE_SERVER_URL}/posts`
);

export const getPosts = async (query?: string): Promise<Post[]> => {
  return (await axiosInstance.get(`/${query}`)).data as Post[];
};

export const getPostById = async (postId: string): Promise<Post> => {
  return (await axiosInstance.get(`/${postId}`)).data as Post;
};

export const createPost = async (post: CreatePostPayload) => {
  const formData = new FormData();
  const { photo, ...postInfo } = post;

  if (photo) {
    formData.append("file", photo);
  }

  formData.append("post", JSON.stringify(postInfo));

  await axiosInstance.post(`/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updatePost = async (
  postId: string,
  updatePostData: UpdatePostPayload
) => {
  const formData = new FormData();
  const { photo, ...updatedPostInfo } = updatePostData;

  if (photo) {
    formData.append("file", photo);
  }

  formData.append("updatedPostContent", JSON.stringify(updatedPostInfo));

  return (
    await axiosInstance.put(`/${postId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  ).data;
};

export const deletePostById = async (postId: string) => {
  return (await axiosInstance.delete(`/${postId}`)).data;
};
