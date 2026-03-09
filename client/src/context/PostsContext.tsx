import { Post } from "../interfaces/post";
import { getPosts, getPostById } from "../services/posts";
import { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

const buildPostsQuery = (
  ownerId?: string,
  offset?: number,
  searchQuery?: string
) => {
  const params = new URLSearchParams();

  if (ownerId) {
    params.set("postOwner", ownerId);
  }

  if (typeof offset === "number") {
    params.set("offset", String(offset));
  }

  if (searchQuery?.trim()) {
    params.set("q", searchQuery.trim());
  }

  return params.toString() ? `?${params.toString()}` : "";
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
    searchQuery,
  }: {
    ownerId?: string;
    offset?: number;
    searchQuery?: string;
  }) => Promise<void>;
} | null;

const PostsContext = createContext<PostsContextType>(null);

export const usePostsContext = () => useContext(PostsContext);

export const PostsContextProvider = ({ children }: { children: ReactNode }) => {
  const [posts, setPosts] = useState<Record<Post["_id"], Post>>({});
  const [isLoading, setIsLoading] = useState(true);

  const clearPosts = useCallback(() => {
    setPosts({});
  }, []);

  const fetchPostById = useCallback(async (postId: string) => {
    try {
      setIsLoading(true);

      const post = await getPostById(postId);
      setPosts((prev) => ({ ...prev, [post._id]: post }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPosts = useCallback(async ({
    ownerId,
    offset,
    searchQuery,
  }: {
    ownerId?: string;
    offset?: number;
    searchQuery?: string;
  }) => {
    try {
      setIsLoading(true);
      const postsMap: Record<Post["_id"], Post> = {};

      (
        await getPosts(buildPostsQuery(ownerId, offset, searchQuery))
      ).forEach((post) => {
        postsMap[post._id] = post;
      });
      setPosts((prev) => ({ ...prev, ...postsMap }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      posts,
      setPosts,
      isLoading,
      fetchPosts,
      clearPosts,
      fetchPostById,
    }),
    [posts, isLoading, fetchPosts, clearPosts, fetchPostById]
  );

  return (
    <PostsContext.Provider value={contextValue}>
      {children}
    </PostsContext.Provider>
  );
};
