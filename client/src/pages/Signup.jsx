import { useState, useEffect } from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

const Signup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Sign Up - Gary's Gallery";
  }, []);

  const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email address").required("Email is required"),
    username: Yup.string()
      .matches(/^[a-zA-Z0-9]+$/, "Username can only contain English letters and numbers")
      .required("Username is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(/[a-z]/, "Password must contain at least one lowercase letter")
      .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
      .required("Password is required"),
  });

  const handleSubmit = async (values) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        const { access_token, refresh_token } = data;
        localStorage.setItem("access_token", access_token);
        document.cookie = `refresh_token=${refresh_token}; path=/; HttpOnly`;
        navigate("/dashboard");
      } else {
        setError(data.detail || "Something went wrong during signup.");
      }
    } catch (error) {
      // console.error(error.message);
      setError("Some error occurred with the server. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-green-400 font-mono">
      <h1 className="text-4xl font-bold mb-6">[ Sign_Up_ ]</h1>

      {/* Formik form */}
      <Formik
        initialValues={{
          email: "",
          username: "",
          password: "",
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="w-[24rem] max-w-full bg-gray-900 p-6 rounded-lg shadow-lg border border-green-400">
            {/* Email Field */}
            <div className="mb-4">
              <label htmlFor="email" className="text-green-300">
                Email:
              </label>
              <Field
                type="email"
                name="email"
                className="w-full mt-1 p-2 bg-gray-800 text-green-300 border border-green-500 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <ErrorMessage name="email" component="div" className="text-red-500 mt-1" />
            </div>

            {/* Username Field */}
            <div className="mb-4">
              <label htmlFor="username" className="text-green-300">
                Username:
              </label>
              <Field
                type="text"
                name="username"
                className="w-full mt-1 p-2 bg-gray-800 text-green-300 border border-green-500 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <ErrorMessage name="username" component="div" className="text-red-500 mt-1" />
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label htmlFor="password" className="text-green-300">
                Password:
              </label>
              <Field
                type="password"
                name="password"
                className="w-full mt-1 p-2 bg-gray-800 text-green-300 border border-green-500 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <ErrorMessage name="password" component="div" className="text-red-500 mt-1" />
            </div>

            {/* Display Error and Success Messages */}
            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full py-2 bg-green-500 text-black rounded-lg hover:bg-green-400 transition"
            >
              {isLoading ? "Signing Up..." : "[ Create_Account ]"}
            </button>
          </Form>
        )}
      </Formik>

      <p className="mt-4 text-xs text-green-500">
        Already have an account?{" "}
        <a href="/login" className="text-green-300 hover:underline">
          [ Login ]
        </a>
      </p>

      <p className="mt-6 text-xs text-green-500">[ System_Functional ]</p>
    </div>
  );
};

export default Signup;
