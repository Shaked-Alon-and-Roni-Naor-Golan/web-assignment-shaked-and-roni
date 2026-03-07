import { Post } from "../interfaces/post";
import { getPosts, getPostById } from "../services/posts";
import { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

const buildPostsQuery = (ownerId?: string, offset?: number) => {
  if (!ownerId && !offset) {
    return "";
  } else {
    let query = "?";
    if (ownerId) {
      query += `postOwner=${ownerId}`;
    }
    if (offset) {
      query += `${
        query.endsWith("?") ? `offset=${offset}` : `&offset=${offset}`
      }`;
    }
    return query;
  }
};

type PostsContextType = {
  posts: Record<Post["_id"], Post>;
  setPosts: React.Dispatch<React.SetStateAction<Record<Post["_id"], Post>>>;
  isLoading: boolean;
  clearPosts: () => void;
  fetchPostById: (postId: string) => void;
  fetchPosts: ({
    ownerId,
    offset,
  }: {
    ownerId?: string;
    offset?: number;
  }) => Promise<void>;
} | null;

const PostsContext = createContext<PostsContextType>(null);

export const usePostsContext = () => useContext(PostsContext);

export const PostsContextProvider = ({ children }: { children: ReactNode }) => {
  const [posts, setPosts] = useState<Record<Post["_id"], Post>>({});
  const [isLoading, setIsLoading] = useState(true);

  const clearPosts = () => {
    setPosts({});
  };

  const fetchPostById = async (postId: string) => {
    try {
      setIsLoading(true);

      const post = await getPostById(postId);
      setPosts((prev) => ({ ...prev, [post._id]: post }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPosts = async ({
    ownerId,
    offset,
  }: {
    ownerId?: string;
    offset?: number;
  }) => {
    try {
      setIsLoading(true);
      const postsMap: Record<Post["_id"], Post> = {};

      (await getPosts(buildPostsQuery(ownerId, offset))).forEach((post) => {
        postsMap[post._id] = post;
      });
      setPosts((prev) => ({ ...prev, ...postsMap }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PostsContext.Provider
      value={{
        posts,
        setPosts,
        isLoading,
        fetchPosts,
        clearPosts,
        fetchPostById,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
};
