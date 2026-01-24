import { User } from "../../dtos/user";

export type UserTokenData = Pick<User, "_id" | "username">;

export const userToTokenData = (user: User) => {
  return {
    _id: user._id.toString(),
    username: user.username,
  };
};