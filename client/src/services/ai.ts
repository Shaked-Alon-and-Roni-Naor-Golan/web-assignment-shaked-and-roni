import { createAxiosInstance } from "../config/axiosInstance";

const axiosInstance = createAxiosInstance(
  `${import.meta.env.VITE_SERVER_URL}/ai`
);

export const enhanceReview = async (content: string) => {
  return (await axiosInstance.post(`/enhance`, { reviewContent: content }))
    .data;
};