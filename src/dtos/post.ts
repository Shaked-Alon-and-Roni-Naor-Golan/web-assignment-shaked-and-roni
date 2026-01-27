import { User } from "./user";

export type Post = {
    _id: string;
    title: string;
    sender: User;
    content: string;
  };