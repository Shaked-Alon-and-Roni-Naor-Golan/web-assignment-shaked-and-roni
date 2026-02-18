import axios from "axios";
import { getToken } from "../services/auth";

export const createAxiosInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
  });

  instance.interceptors.request.use(async (config) => {
    try {
      const authToken = await getToken();

      if (authToken) {
        config.headers.set("Authorization", `Bearer ${authToken}`);
        config.headers.set("Content-Type", "application/json", false);
      } else throw new Error("No token found");
    } catch (err) {
      console.log("Can't handle token in request:", err);
    }

    return config;
  });

  return instance;
};
