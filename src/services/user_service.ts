import { User } from "../dtos/user";
import { UserModel } from "../models/user_model";

export const findUserById = async (userId: string) => {
  return await UserModel.findById(userId);
};

export const createNewUser = async (user: User) => {
  return await UserModel.create(user);
};
