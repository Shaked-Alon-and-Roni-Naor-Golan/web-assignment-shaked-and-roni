import axios, { AxiosHeaders } from "axios";
import { getToken } from "../services/auth";

export const createAxiosInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
  });

  instance.interceptors.request.use(async (config) => {
    try {
      const authToken = await getToken();

      if (!authToken) {
        throw new Error("No token found");
      }

      const headers = AxiosHeaders.from(config.headers);
      headers.set("Authorization", `Bearer ${authToken}`);
      config.headers = headers;
    } catch (err) {
      console.log("Can't handle token in request:", err);
    }

    return config;
  });

  return instance;
};
