import { createAxiosInstance } from "../config/axiosInstance";
import { PostComment } from "../interfaces/comment";

const axiosInstance = createAxiosInstance(
  `${import.meta.env.VITE_SERVER_URL}/comments`
);

export const getAllComments = async () => {
  return (await axiosInstance.get(`/`)).data;
};

export const createComment = async (postId: string, comment: PostComment) => {
  return (await axiosInstance.post(`/`, { comment, postId })).data;
};

export const updateComment = async (comment: PostComment) => {
  return (await axiosInstance.put(`/${comment.id}`, comment)).data;
};

export const deleteCommentById = async (commentId: string) => {
  return (await axiosInstance.delete(`/${commentId}`)).data;
};