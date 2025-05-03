import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";

import showToast from "../components/Notification";
import { AuthContext } from "../contexts/AuthContext";

const Signup = () => {
  const { loginUser } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Sign Up - TermiPics";
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

  const handleSubmit = async values => {
    setIsLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/auth/signup`, values, {
        headers: { "Content-Type": "application/json" },
      });
      showToast({
        title: "Success",
        msg: "Account created.",
        type: "success",
      });
      navigate("/login");
    } catch (error) {
      showToast({
        title: "Error",
        msg: error.response.data.detail,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async codeResponse => {
      try {
        setIsLoading(true);
        const authResponse = await axios.post(`${import.meta.env.VITE_SERVER_URL}/auth/google`, {
          code: codeResponse.code,
        });
        const { access_token, refresh_token, user_uid } = authResponse.data;
        loginUser(access_token, refresh_token, user_uid);
        showToast({
          title: "Success",
          msg: "You are now logged in with Google.",
          type: "success",
        });
        navigate("/dashboard");
      } catch (error) {
        showToast({
          title: "Error",
          msg: "Error occurred while authenticating with Google.",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      showToast({
        title: "Error",
        msg: "Google login failed. Please try again.",
        type: "error",
      });
    },
  });

  return (
    <div className="flex justify-center items-center bg-black min-h-screen">
      <div className="flex flex-col justify-center items-center bg-black min-h-screen font-mono text-green-500">
        <h1 className="mb-6 font-bold text-4xl">[ Sign_Up_ ]</h1>
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
            <Form className="bg-gray-900 p-6 border border-green-700 rounded-lg w-[24rem] max-w-full">
              {/* Email Field */}
              <div className="mb-4">
                <label htmlFor="email" className="text-green-300">
                  Email:
                </label>
                <Field
                  type="email"
                  name="email"
                  className="bg-gray-800 mt-1 p-2 rounded-md focus:outline-none w-full text-green-300"
                />
                <ErrorMessage name="email" component="div" className="mt-1 text-rose-500" />
              </div>
              {/* Username Field */}
              <div className="mb-4">
                <label htmlFor="username" className="text-green-300">
                  Username:
                </label>
                <Field
                  type="text"
                  name="username"
                  className="bg-gray-800 mt-1 p-2 rounded-md focus:outline-none w-full text-green-300"
                />
                <ErrorMessage name="username" component="div" className="mt-1 text-rose-500" />
              </div>
              {/* Password Field */}
              <div className="mb-6">
                <label htmlFor="password" className="text-green-300">
                  Password:
                </label>
                <Field
                  type="password"
                  name="password"
                  className="bg-gray-800 mt-1 p-2 rounded-md focus:outline-none w-full text-green-300"
                />
                <ErrorMessage name="password" component="div" className="mt-1 text-rose-500" />
              </div>
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="bg-green-500 hover:bg-green-300 py-2 rounded-lg w-full text-black transition hover:cursor-pointer"
              >
                {isLoading ? "Signing Up..." : "[ Create_Account ]"}
              </button>
            </Form>
          )}
        </Formik>

        <div className="flex items-center my-6 w-full">
          <div className="flex-grow bg-green-700 h-px" />
          <span className="mx-4">or</span>
          <div className="flex-grow bg-green-700 h-px" />
        </div>

        <button
          onClick={() => handleGoogleLogin()}
          className="flex justify-center items-center space-x-3 bg-gray-900 hover:bg-gray-800 mb-6 py-2 rounded-lg w-full text-green-300 transition"
        >
          <FontAwesomeIcon icon={faGoogle} className="text-xl" />
          <span>[ Continue_With_Google ]</span>
        </button>

        <p className="mt-4 text-xs">
          Already have an account?{" "}
          <a href="/login" className="text-green-300 hover:underline">
            [ Login ]
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
