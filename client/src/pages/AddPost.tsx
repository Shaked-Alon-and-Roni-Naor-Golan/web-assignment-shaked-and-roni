import { useState } from "react";
import PostForm from "../components/AddPostForm";

export interface PostData {
  content: string;
  photo?: File | null;
}

const AddPost = () => {
  const [formData, setFormData] = useState<PostData>({
    content: "",
    photo: null,
  });

  const handleInputChange = (
    field: keyof PostData,
    value: string | File | null | number
  ) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  return (
    <div className="d-flex justify-content-center align-items-center">
      <div
        style={{
          width: "550px",
          height: "100%",
          backgroundColor: "#F8F9FA",
          padding: "15px",
          boxShadow: " rgba(0, 0, 0, 0.24) 0px 3px 8px",
        }}
      >
        <PostForm formData={formData} onInputChange={handleInputChange} />
      </div>
    </div>
  );
};

export default AddPost;