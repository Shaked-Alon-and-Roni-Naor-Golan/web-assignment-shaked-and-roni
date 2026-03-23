import { useCallback, useEffect, useRef, useState } from "react";
import PostComponent from "./Post";
import { usePostsContext } from "../context/PostsContext";

type Props = {
  currentUser?: string;
  searchQuery?: string;
  onSearchLoadingChange?: (isLoading: boolean) => void;
};

export const PostsList = ({
  currentUser,
  searchQuery,
  onSearchLoadingChange,
}: Props) => {
  const [, setCurrentOffset] = useState<number>(0);
  const [pendingSearchQuery, setPendingSearchQuery] = useState<string | null>(
    null
  );
  const { posts, fetchPosts, isLoading } = usePostsContext() ?? {};

  const reFetch = useCallback(
    (offset: number) => {
      fetchPosts?.({
        offset,
        ownerId: currentUser,
        searchQuery,
      });
    },
    [currentUser, fetchPosts, searchQuery]
  );

  useEffect(() => {
    setCurrentOffset(0);
    fetchPosts?.({ ownerId: currentUser, offset: 0, searchQuery, replace: true });
  }, [currentUser, fetchPosts, searchQuery]);

  useEffect(() => {
    const normalizedSearch = searchQuery?.trim() ?? "";

    if (normalizedSearch) {
      setPendingSearchQuery(normalizedSearch);
      onSearchLoadingChange?.(true);
      return;
    }

    setPendingSearchQuery(null);
    onSearchLoadingChange?.(false);
  }, [onSearchLoadingChange, searchQuery]);

  useEffect(() => {
    if (!pendingSearchQuery) {
      return;
    }

    if (!isLoading) {
      onSearchLoadingChange?.(false);
      setPendingSearchQuery(null);
    }
  }, [isLoading, onSearchLoadingChange, pendingSearchQuery]);

  const loaderRef = useRef(null);

  const increaseOffset = useCallback(() => {
    setCurrentOffset((prev) => {
      if (prev <= Object.values(posts ?? {}).length) {
        const nextOffset = prev + 3;
        reFetch(nextOffset);
        return nextOffset;
      }

      return prev;
    });
  }, [posts, reFetch]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!isLoading && Object.values(posts ?? {}).length > 0) {
            increaseOffset();
          }
        }
      },
      { root: null, rootMargin: "150px", threshold: 1.0 }
    );

    const currentLoader = loaderRef.current;

    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [increaseOffset, isLoading, posts]);

  return (
    <div
      style={{
        height: "100%",
        backgroundColor: "#fcd9f5ff",
        width: "600px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {isLoading && Object.values(posts ?? {}).length === 0 ? (
        <div
          className="spinner-border text-success"
          style={{ width: "15rem", height: "15rem" }}
        />
      ) : (
        <div>
          <div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {Object.values(posts ?? {})?.length ? (
                Object.values(posts ?? {}).map((post) => (
                  <div key={post._id}>
                    <PostComponent
                      isEditable={!!currentUser}
                      showActionBar={!!currentUser}
                      key={post._id}
                      post={post}
                    />
                  </div>
                ))
              ) : (
                <div>
                  <p>
                    {searchQuery
                      ? "No posts match your search."
                      : "No posts available."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div
        ref={loaderRef}
        style={{ height: "20px", background: "transparent" }}
      ></div>
    </div>
  );
};