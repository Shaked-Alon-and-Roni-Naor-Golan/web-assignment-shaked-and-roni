import moment from "moment";
import { User } from "../interfaces/user";
import axios from "axios";
import { Token } from "../interfaces/auth";
import { SignUpData } from "../pages/SignUp";

const AUTH_BASE_URL = `${import.meta.env.VITE_SERVER_URL}/auth`;

enum LocalStorageNames {
  AccessToken = "ACCESS_TOKEN",
  RefreshToken = "REFRESH_TOKEN",
}

type CreateTokenResult = {
  accessToken: Token;
  refreshToken: Token;
};

type CreateTokenResultWithUser = CreateTokenResult & { user: User };

export const getToken = async () => {
  return getAuthTokenFromStorage() ?? (await generateNewToken());
};

const getAuthTokenFromStorage = () => {
  try {
    const accessToken = JSON.parse(
      localStorage.getItem(LocalStorageNames.AccessToken) ?? ""
    ) as Token;
    return isTokenValid(accessToken?.expireDate) ? accessToken.token : null;
  } catch (error) {
    console.log(error, "Couldn't resolve access token from storage");
  }
};

const generateNewToken = async () => {
  try {
    const refreshToken = JSON.parse(
      localStorage.getItem(LocalStorageNames.RefreshToken) ?? ""
    ) as Token;

    if (!isTokenValid(refreshToken?.expireDate)) {
      throw new Error("Token has been expired, couldn't create a new token");
    }

    const token = await refreshTokenAndGenerateNewToken(refreshToken.token);

    return token;
  } catch (err) {
    console.log(err, "Couldn't generate new token");
    return null;
  }
};

const isTokenValid = (tokenExpireDate: Date) => {
  return (
    tokenExpireDate &&
    moment(tokenExpireDate).isAfter(moment().add(1, "minutes"))
  );
};

const refreshTokenAndGenerateNewToken = async (refreshToken: string) => {
  try {
    const { accessToken, refreshToken: newRefreshToken } = (
      await axios.post<CreateTokenResult>(
        `${AUTH_BASE_URL}/refresh-token`,
        {},
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      )
    ).data;

    localStorage.setItem(
      LocalStorageNames.AccessToken,
      JSON.stringify(accessToken)
    );

    localStorage.setItem(
      LocalStorageNames.RefreshToken,
      JSON.stringify(newRefreshToken)
    );

    return accessToken.token;
  } catch (err) {
    console.log(err, "Failed to init auth from refresh token");
  }
};

export const authLogout = async () => {
  try {
    const { token } = JSON.parse(
      localStorage.getItem(LocalStorageNames.RefreshToken) ?? ""
    ) as Token;

    await axios.post(
      `${AUTH_BASE_URL}/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    localStorage.removeItem(LocalStorageNames.AccessToken);
    localStorage.removeItem(LocalStorageNames.RefreshToken);
  } catch (err) {
    console.log(err, "Failed to logout");
    throw err;
  }
};

export const login = async (username: string, password: string) => {
  try {
    const { accessToken, refreshToken, user } = (
      await axios.post<CreateTokenResultWithUser>(`${AUTH_BASE_URL}/login`, {
        username,
        password,
      })
    ).data;

    localStorage.setItem(
      LocalStorageNames.AccessToken,
      JSON.stringify({ accessToken })
    );

    localStorage.setItem(
      LocalStorageNames.RefreshToken,
      JSON.stringify(refreshToken)
    );

    return user;
  } catch (err) {
    console.log(err, "Failed to login");
    throw err;
  }
};

export const googleLogin = async (credential?: string) => {
  try {
    const { accessToken, refreshToken, user } = (
      await axios.post<CreateTokenResultWithUser>(
        `${AUTH_BASE_URL}/google-login`,
        {
          credential,
        }
      )
    ).data;

    localStorage.setItem(
      LocalStorageNames.AccessToken,
      JSON.stringify({ accessToken })
    );

    localStorage.setItem(
      LocalStorageNames.RefreshToken,
      JSON.stringify(refreshToken)
    );

    return user;
  } catch (err) {
    console.log(err, "Failed to google login");
    throw err;
  }
};

export const signup = async (userData: SignUpData) => {
  try {
    const formData = new FormData();
    const { photo, ...userInfo } = userData;

    if (photo) {
      formData.append("file", photo);
    }

    formData.append("user", JSON.stringify(userInfo));

    const { accessToken, refreshToken, user } = (
      await axios.post<CreateTokenResultWithUser>(
        `${AUTH_BASE_URL}/register`,
        formData,
        {
          headers: {
            "Content-Type": "image/jpeg",
          },
        }
      )
    ).data;

    localStorage.setItem(
      LocalStorageNames.AccessToken,
      JSON.stringify({ accessToken })
    );

    localStorage.setItem(
      LocalStorageNames.RefreshToken,
      JSON.stringify(refreshToken)
    );

    return user;
  } catch (err) {
    console.error("Couldn't sign up", err);
  }
};
