export type User = {
  _id: string;
  username: string;
  password: string;
  email: string;
  photo?: string;
  tokens?: string[];
};
