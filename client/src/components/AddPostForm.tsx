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
import { StarRating } from "./StarRating";
import { enhanceReview } from "../services/ai";

const formSchema = z.object({
  content: z.string().min(1, "Description is required"),
  rating: z.number().min(1).max(5),
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
    const enhancedContent = await enhanceReview(formData.content);
    setValue("content", enhancedContent);
    onInputChange("content", enhancedContent);
  };

  const onSubmit = async ({ content, photo, rating }: PostData) => {
    try {
      if (isEmpty(errors)) {
        await createPost({ content, photo, owner: user!._id, rating });
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
        <div className="d-flex justify-content-center align-items-center mb-3">
          <StarRating
            rating={formData.rating}
            onRatingChanged={(newRating: number) => {
              setValue("rating", newRating);
              onInputChange("rating", newRating);
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",

            marginBottom: "15px",
          }}
        >
          <div style={{ justifyContent: "end", width: "85%" }}>
            <button
              className="btn btn-success"
              onClick={onEnhance}
              type="button"
              style={{
                marginBottom: "5px",
                width: "20%",
                display: "flex",
                flexDirection: "row",
                fontSize: "0.8rem",
                alignItems: "center",
              }}
            >
              <FaWandMagicSparkles size={12} style={{ marginRight: "5px" }} />
              Enhance
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
          style={{ width: "85%" }}
          className="btn btn-success"
        >
          Add Your Review
        </button>
      </div>
    </form>
  );
};

export default PostForm;