import { AxiosError } from "axios";
import { createAxiosInstance } from "../config/axiosInstance";
import { UpdateUser } from "../interfaces/user";
import { Token } from "../interfaces/auth";
import { storeAuthTokens } from "./auth";

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

    const response = await axiosInstance.put<{
      user: any;
      accessToken?: Token;
      refreshToken?: Token;
    }>(`/${userId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const { user, accessToken, refreshToken } = response.data ?? {};

    if (accessToken && refreshToken) {
      storeAuthTokens({ accessToken, refreshToken });
    }

    return user ?? response.data;
  } catch (error) {
    if (
      error instanceof AxiosError &&
      error.response?.status === 400 &&
      error.response.data?.userExist
    ) {
      throw new Error(error.message);
    } else {
      throw new Error("error updating user");
    }
  }
};
