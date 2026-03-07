import { useEffect, useRef, useState } from "react";
import { updateUser } from "../services/users";
import UserProfile from "../components/UserProfile";
import { useUserContext } from "../context/UserContext";
import { usePostsContext } from "../context/PostsContext";
import { enqueueSnackbar } from "notistack";
import { PostsList } from "../components/PostsList";

const Profile = () => {
  const { user, setUser } = useUserContext() ?? {};
  const { setPosts } = usePostsContext() ?? {};
  const userProfileRef = useRef<HTMLDivElement>(null);
  const [isProfileEditing, setIsProfileEditing] = useState(false);

  const handleSaveProfile = async (
    updatedUsername: string,
    updatedProfilePhoto: File | null
  ) => {
    try {
      const isSameUsername = updatedUsername === user?.username;
      const hasNewPhoto = !!updatedProfilePhoto;

      if (isSameUsername && !hasNewPhoto) {
        return;
      }

      const updatedData = {
        username: updatedUsername,
        ...(updatedProfilePhoto && { photo: updatedProfilePhoto }),
      };

      const updatedUser = await updateUser(user!._id, updatedData);

      const nextUser = {
        ...(user as any),
        ...(updatedUser as any),
        photo: (updatedUser as any)?.photo ?? user?.photo ?? null,
      } as any;

      setUser?.(nextUser);

      setPosts?.((prevPosts: any) => {
        const nextPosts = { ...(prevPosts ?? {}) };
        Object.keys(nextPosts).forEach((postId) => {
          const currPost = nextPosts[postId];
          if (currPost?.owner?._id === nextUser._id) {
            nextPosts[postId] = {
              ...currPost,
              owner: {
                ...currPost.owner,
                username: nextUser.username,
                photo: nextUser.photo,
              },
            };
          }
        });
        return nextPosts;
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error("error updating user - ", error.message);
        enqueueSnackbar(error.message, { variant: "error" });
      }
    }
  };

  useEffect(() => {
    const buttons = Array.from(userProfileRef.current?.querySelectorAll("button") ?? []);
    const iconOnlyEditBtn = buttons.find((btn) => !btn.textContent?.trim());
    const saveBtn = buttons.find(
      (btn) => btn.textContent?.trim().toLowerCase() === "save"
    );

    if (iconOnlyEditBtn) (iconOnlyEditBtn as HTMLButtonElement).style.display = "none";
    if (saveBtn) (saveBtn as HTMLButtonElement).style.display = "none";
  }, [user, isProfileEditing]);

  const handleProfileActionClick = () => {
    const buttons = Array.from(userProfileRef.current?.querySelectorAll("button") ?? []);
    const iconOnlyEditBtn = buttons.find((btn) => !btn.textContent?.trim());
    const saveBtn = buttons.find(
      (btn) => btn.textContent?.trim().toLowerCase() === "save"
    );

    if (!isProfileEditing) {
      (iconOnlyEditBtn as HTMLButtonElement | undefined)?.click();
      setIsProfileEditing(true);
      return;
    }

    (saveBtn as HTMLButtonElement | undefined)?.click();
    setIsProfileEditing(false);
  };

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {user && (
        <div
          style={{ width: "100%", height: "15%", backgroundColor: "#fcd9f5ff" }}
        >
          <div ref={userProfileRef}>
            <UserProfile
              username={user.username}
              email={user.email}
              profilePhoto={user.photo || null}
              onSaveProfile={handleSaveProfile}
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
        <button className="btn btn-dark btn-sm" onClick={handleProfileActionClick}>
          {isProfileEditing ? "Save" : "Edit Profile"}
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <PostsList currentUser={user?._id} />
      </div>
    </div>
  );
};

export default Profile;