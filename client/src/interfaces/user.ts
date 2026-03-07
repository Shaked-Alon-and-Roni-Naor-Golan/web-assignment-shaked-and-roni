export interface User {
  _id: string;
  username: string;
  password: string;
  email: string;
  tokens?: string[];
  photo?: string;
}

export interface UpdateUser {
  username?: string;
  photo?: File | null;
}
