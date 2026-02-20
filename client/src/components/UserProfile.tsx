import { FaEdit } from "react-icons/fa";
import DropzoneComponent from "./Dropzone";
import { useEffect, useState } from "react";
import { IMAGES_URL } from "../constants/files";

interface UserProfileProps {
  username: string;
  email: string;
  profilePhoto: string | null;
  onSaveProfile: (
    updatedUsername: string,
    updatedProfilePhoto: File | null
  ) => void;
}

const UserProfile = ({
  username,
  email,
  profilePhoto,
  onSaveProfile,
}: UserProfileProps) => {
  const [editMode, setEditMode] = useState(false);
  const [newUsername, setNewUsername] = useState(username);
  const [newProfilePhoto, setNewProfilePhoto] = useState<File | null>(null);

  useEffect(() => {
    setNewUsername(username);
  }, [username]);

  const handleSave = async () => {
    await onSaveProfile(newUsername, newProfilePhoto);
    setEditMode(false);
    setNewProfilePhoto(null);
    setNewUsername(username);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        paddingTop: "15px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div>
        <button
          className="btn btn-light"
          style={{
            border: "none",
            background: "transparent",
            position: "absolute",
            left: 0,
          }}
          onClick={() => setEditMode((prev) => !prev)}
        >
          <FaEdit size={20} />
        </button>
      </div>

      <div>
        {editMode ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className="mb-3">
              <p>
                <strong>Email:</strong> {email}
              </p>
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <DropzoneComponent
                onFileSelect={(file) => setNewProfilePhoto(file)}
                height="80px"
                width="80px"
                selectedFile={newProfilePhoto}
              />
              <img src="" />
            </div>

            <button className="btn btn-dark" onClick={handleSave}>
              Save
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <h2>Happy to see you {username}</h2>
            <p>
              <strong>Email:</strong> {email}
            </p>
            <div className="mb-3">
              <img
                src={
                  profilePhoto
                    ? profilePhoto.startsWith("http")
                      ? profilePhoto
                      : IMAGES_URL + profilePhoto
                    : "/temp-user.png"
                }
                alt="Profile"
                className="rounded-circle"
                style={{ width: "150px", height: "150px" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
