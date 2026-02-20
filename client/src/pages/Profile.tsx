import { updateUser } from "../services/users";
import UserProfile from "../components/UserProfile";
import { useUserContext } from "../context/UserContext";
import { enqueueSnackbar } from "notistack";
import { PostsList } from "../components/PostsList";

const Profile = () => {
  const { user, setUser } = useUserContext() ?? {};

  const handleSaveProfile = async (
    updatedUsername: string,
    updatedProfilePhoto: File | null
  ) => {
    try {
      const updatedData = {
        username: updatedUsername,
        ...(updatedProfilePhoto && { photo: updatedProfilePhoto }),
      };
      setUser?.(await updateUser(user!._id, updatedData));
    } catch (error) {
      if (error instanceof Error) {
        console.error("error updating user - ", error.message);
        enqueueSnackbar(error.message, { variant: "error" });
      }
    }
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
          style={{ width: "100%", height: "15%", backgroundColor: "#fcf1d9" }}
        >
          <UserProfile
            username={user.username}
            email={user.email}
            profilePhoto={user.photo || null}
            onSaveProfile={handleSaveProfile}
          />
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <PostsList currentUser={user?._id} />
      </div>
    </div>
  );
};

export default Profile;
