import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { Formik, Field, Form, ErrorMessage } from "formik";
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

import { AuthContext } from "../contexts/AuthContext";

const Login = () => {
  const { loginUser } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login - Gary's Gallery";
  }, []);

  const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email address").required("Email is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .required("Password is required"),
  });

  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/auth/login/`, values, {
        headers: { "Content-Type": "application/json" },
      });
      const { access_token, refresh_token, user_uid } = response.data;
      loginUser(access_token, refresh_token, user_uid);
      navigate("/dashboard");
    } catch (error) {
      if (error.response) {
        setError("Some error occurred with the server. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      try {
        setIsLoading(true);
        const authResponse = await axios.post(`${import.meta.env.VITE_SERVER_URL}/auth/google`, {
          code: codeResponse.code,
        });
        const { access_token, refresh_token, user_uid } = authResponse.data;
        loginUser(access_token, refresh_token, user_uid);
        navigate("/dashboard");
      } catch (error) {
        setError("Error occurred while authenticating with Google.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError("Google login failed. Please try again.");
    },
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-green-400 font-mono">
      <h1 className="text-4xl font-bold mb-6">[ Login_ ]</h1>
      <Formik
        initialValues={{
          email: "",
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
            {/* Display Error Messages */}
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full py-2 bg-green-500 text-black rounded-lg hover:bg-green-600 transition"
            >
              {isLoading ? "Logging In..." : "[ Log_In ]"}
            </button>
          </Form>
        )}
      </Formik>

      <div className="flex items-center my-6 w-full">
        <div className="flex-grow h-px bg-green-500"></div>
        <span className="mx-4 text-green-300">or</span>
        <div className="flex-grow h-px bg-green-500"></div>
      </div>

      <button
        onClick={() => handleGoogleLogin()}
        className="w-full py-2 mb-6 bg-gray-900 text-green-300 rounded-lg hover:bg-gray-800 transition flex items-center justify-center space-x-3"
      >
        <FontAwesomeIcon icon={["fab", "google"]} className="text-xl" />
        <span>[ Continue_With_Google ]</span>
      </button>

      <p className="mt-4 text-xs text-green-500">
        Don&apos;t have an account yet?{" "}
        <a href="/signup" className="text-green-300 hover:underline">
          [ Sign Up ]
        </a>
      </p>
    </div>
  );
};

export default Login;
