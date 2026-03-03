import { z } from "zod";
import { useForm } from "react-hook-form";
import DropzoneComponent from "./Dropzone";
import { PostData } from "../pages/AddPost";
import { createPost } from "../services/posts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUserContext } from "../context/UserContext";
import { ACCEPTED_IMAGE_TYPES } from "../constants/files";
import { isEmpty } from "lodash";
import { useNavigate } from "react-router-dom";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { enqueueSnackbar } from "notistack";
import { enhanceReview } from "../services/ai";
import { useState } from "react";

const formSchema = z.object({
  content: z.string().min(1, "Description is required"),
  photo: z
    .any()
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

type FormData = z.infer<typeof formSchema>;

interface PostFormProps {
  formData: PostData;
  onInputChange: (
    field: keyof PostData,
    value: string | File | number | null
  ) => void;
}

const PostForm = ({ formData, onInputChange }: PostFormProps) => {
  const [isEnhancing, setIsEnhancing] = useState(false);

  const {
    handleSubmit,
    formState: { errors },
    register,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const navigate = useNavigate();

  const { user } = useUserContext() ?? {};

  const onEnhance = async () => {
    try {
      setIsEnhancing(true);
      const enhancedContent = await enhanceReview(formData.content);
      setValue("content", enhancedContent);
      onInputChange("content", enhancedContent);
    } catch (error) {
      console.error("error enhancing text", error);
      enqueueSnackbar("Failed to enhance text", { variant: "error" });
    } finally {
      setIsEnhancing(false);
    }
  };

  const onSubmit = async ({ content, photo }: PostData) => {
    try {
      if (isEmpty(errors)) {
        await createPost({ content, photo, owner: user!._id });
        navigate("/");
      }
    } catch (error) {
      console.error("error creating post", error);
      enqueueSnackbar("Failed to create post", { variant: "error" });
    }
  };

  return (
    <form
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
      onSubmit={handleSubmit(onSubmit)}
    >
      <h2 style={{ textAlign: "center", marginBottom: "16px" }}>
        Add your lovely movie!
      </h2>

      <div>
        <div className="mb-3">
          <DropzoneComponent
            onFileSelect={(file) => {
              setValue("photo", file);
              onInputChange("photo", file);
            }}
            selectedFile={formData.photo ?? null}
            height="450px"
          />
          {errors.photo && <p className="text-danger">Photo is required</p>}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",

            marginBottom: "15px",
          }}
        ><br/>
          <div style={{ justifyContent: "end", width: "85%" }}>
            <button
              className="btn"
              onClick={onEnhance}
              type="button"
              disabled={isEnhancing}
              style={{
                marginBottom: "5px",
                display: "flex",
                flexDirection: "row",
                fontSize: "0.8rem",
                alignItems: "center",
                backgroundColor: "#87CEFA",
                borderColor: "#87CEFA",
                color: "#000000",
                opacity: isEnhancing ? 0.8 : 1,
              }}
            >
              {isEnhancing ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                    style={{ marginRight: "8px" }}
                  />
                  Enhancing...
                </>
              ) : (
                <>
                  <FaWandMagicSparkles size={19} />
                  Enhance Your Text
                </>
              )}
            </button>
          </div>

          <textarea
            {...register("content")}
            style={{ width: "85%" }}
            value={formData.content}
            onChange={(e) => onInputChange("content", e.target.value)}
          />
        </div>

        {errors.content && (
          <p className="text-danger">{errors.content.message}</p>
        )}
      </div>

      <div className="d-flex justify-content-center align-items-center mb-3">
        <button
          type="submit"
          style={{
            width: "85%",
            backgroundColor: "#87CEFA",
            borderColor: "#87CEFA",
            color: "#000000",
          }}
          className="btn"
        >
          Add Your Movie
        </button>
      </div>
    </form>
  );
};

export default PostForm;