import { RefreshTokenModel } from "../models/refresh_token_model";

export const findRefreshToken = async (token: string) => {
  return await RefreshTokenModel.findOne({ token });
};

export const createRefreshToken = async (token: string) => {
  return await RefreshTokenModel.create({ token });
};

export const deleteRefreshToken = async (token: string) => {
  return await RefreshTokenModel.deleteOne({ token });
};