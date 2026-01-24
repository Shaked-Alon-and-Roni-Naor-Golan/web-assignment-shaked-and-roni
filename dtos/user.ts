export type User = {
  _id: string;
  username: string;
  password: string;
  email: string;
  refreshTokens?: string[];
};