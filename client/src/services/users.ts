import { AxiosError } from "axios";
import { createAxiosInstance } from "../config/axiosInstance";
import { UpdateUser } from "../interfaces/user";

const axiosInstance = createAxiosInstance(
  `${import.meta.env.VITE_SERVER_URL}/users`
);

export const getMe = async () => {
  return (await axiosInstance.get(`/me`)).data;
};

export const updateUser = async (
  userId: string,
  { photo, username }: UpdateUser
) => {
  try {
    const formData = new FormData();

    if (photo) {
      formData.append("file", photo);
    }

    if (username) {
      formData.append("username", username);
    }

    return (
      await axiosInstance.put(`/${userId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    ).data;
  } catch (error) {
    if (
      error instanceof AxiosError &&
      error.response?.status === 400 &&
      error.response.data.userExist
    ) {
      throw new Error(error.message);
    } else {
      throw new Error("error updating user");
    }
  }
};
