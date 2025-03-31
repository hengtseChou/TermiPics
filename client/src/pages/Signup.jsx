import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { Formik, Field, Form, ErrorMessage } from "formik";
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

import showToast from "../components/Notification";
import { AuthContext } from "../contexts/AuthContext";

const Signup = () => {
  const { loginUser } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const successNotification = (msg) => {
    showToast({
      title: "Success",
      text: msg,
      type: "success",
    });
  };
  const errorNotification = (msg) => {
    showToast({
      title: "Error",
      text: msg,
      type: "error",
    });
  };

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
    try {
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/auth/signup`, values, {
        headers: { "Content-Type": "application/json" },
      });
      successNotification("Account created.");
      navigate("/login");
    } catch (error) {
      errorNotification(error.response.data.detail);
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
        successNotification("You are now logged in with Google.");
        navigate("/dashboard");
      } catch (error) {
        errorNotification("Error occurred while authenticating with Google.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      errorNotification("Google login failed. Please try again.");
    },
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-green-400 font-mono">
      <h1 className="text-4xl font-bold mb-6">[ Sign_Up_ ]</h1>
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
              <ErrorMessage name="email" component="div" className="text-rose-500 mt-1" />
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
              <ErrorMessage name="username" component="div" className="text-rose-500 mt-1" />
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
              <ErrorMessage name="password" component="div" className="text-rose-500 mt-1" />
            </div>
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full py-2 bg-green-500 text-black rounded-lg hover:bg-green-600 transition"
            >
              {isLoading ? "Signing Up..." : "[ Create_Account ]"}
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
        Already have an account?{" "}
        <a href="/login" className="text-green-300 hover:underline">
          [ Login ]
        </a>
      </p>
    </div>
  );
};

export default Signup;
