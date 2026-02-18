import React, { useState } from "react";
import SignUpForm from "../components/SignUpForm";

export type SignUpData = {
  username: string;
  password: string;
  email: string;
  photo?: File | null;
};

const SignUp = () => {
  const [formData, setFormData] = useState<SignUpData>({
    username: "",
    password: "",
    email: "",
    photo: null,
  });

  const handleInputChange = (
    field: keyof SignUpData,
    value: string | File | null
  ) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div
        className="card p-4"
        style={{ width: "600px", borderRadius: "30px" }}
      >
        <div className="text-center mb-2">
          <img
            src="/src/assets/logo.png"
            alt="JustEat Logo"
            style={{ width: "150px", height: "150px" }}
          />
          <h4 className="mt-2">JustEat</h4>
          <p className="text-muted">Hungry? Just sign up!</p>
        </div>
        <SignUpForm formData={formData} onInputChange={handleInputChange} />
        <p className="text-center mt-3">
          Already have an account?{" "}
          <a href="/" className="text-dark">
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
