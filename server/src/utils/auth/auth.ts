import ms from "ms";
import moment from "moment";
import { User } from "../../dtos/user";
import { generateAccessToken } from "./generate_access_token";
import { generateRefreshToken } from "./generate_refresh_token";

export type JwtInfo = Pick<User, "_id" | "username">;

export const convertUserToJwtInfo = (user: User) => {
  return {
    _id: user._id.toString(),
    username: user.username,
    email: user.email,
    photo: user.photo,
  };
};
const generateAndSaveTokens = async (user: User) => {
  const accessToken = generateAccessToken(
    convertUserToJwtInfo(user),
    process.env.ACCESS_TOKEN_SECRET,
    process.env.ACCESS_TOKEN_EXPIRATION
  );

  const refreshToken = generateRefreshToken(
    convertUserToJwtInfo(user),
    process.env.REFRESH_TOKEN_SECRET,
    process.env.REFRESH_TOKEN_EXPIRATION
  );

  const userTokens = user.tokens
    ? [...user.tokens, refreshToken]
    : [refreshToken];

  return {
    accessToken: {
      token: accessToken,
      expireDate: moment().add(ms(process.env.ACCESS_TOKEN_EXPIRATION)),
    },
    refreshToken: {
      token: refreshToken,
      expireDate: moment().add(ms(process.env.REFRESH_TOKEN_EXPIRATION)),
    },
    userTokens,
  };
};

export { generateAndSaveTokens };
