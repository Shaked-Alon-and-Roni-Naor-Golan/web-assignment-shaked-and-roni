import { Types } from "mongoose";

export type Post = {
    _id: string;
    title: string;
    sender: string; // TODO: change to User type
    content: string;
  };