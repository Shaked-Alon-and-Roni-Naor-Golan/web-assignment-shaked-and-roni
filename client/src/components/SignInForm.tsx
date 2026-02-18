import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignInData } from "../pages/SignIn";
import { login } from "../services/auth";
import { useUserContext } from "../context/UserContext";
import { useState } from "react";
import { isEmpty } from "lodash";

type SignInFormProps = {
  formData: SignInData;
  onInputChange: (field: keyof SignInData, value: string | File | null) => void;
};
const formSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

type formData = z.infer<typeof formSchema>;

const SignInForm = ({ formData, onInputChange }: SignInFormProps) => {
  const { setUser } = useUserContext() ?? {};

  const {
    handleSubmit,
    formState: { errors },
    register,
  } = useForm<SignInData>({ resolver: zodResolver(formSchema) });

  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async ({ username, password }: formData) => {
    try {
      if (isEmpty(errors)) {
        const user = await login(username, password);
        setUser?.(user);
      }
    } catch (err) {
      console.error("error login user", err);
      setServerError("Failed to signup user, please try again.");
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-3">
        <input
          {...register("username")}
          type="text"
          className="form-control"
          placeholder="Username*"
          value={formData.username}
          onChange={(e) => onInputChange("username", e.target.value)}
        />
        {errors.username && (
          <p className="text-danger">{errors.username.message}</p>
        )}
      </div>
      <div className="mb-3">
        <input
          {...register("password")}
          type="password"
          className="form-control"
          placeholder="Password*"
          value={formData.password}
          onChange={(e) => onInputChange("password", e.target.value)}
        />
        {errors.password && (
          <p className="text-danger">{errors.password.message}</p>
        )}
      </div>
      {serverError && <p className="text-danger">{serverError}</p>}
      <button type="submit" className="btn btn-dark w-100">
        Sign In
      </button>
    </form>
  );
};

export default SignInForm;
