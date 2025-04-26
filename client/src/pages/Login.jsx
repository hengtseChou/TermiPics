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

const Login = () => {
  const { loginUser } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login - TermiPics";
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
      showToast({
        title: "Success",
        msg: "You are now logged in.",
        type: "success",
      });
      navigate("/dashboard");
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
    onSuccess: async (codeResponse) => {
      try {
        setIsLoading(true);
        const authResponse = await axios.post(`${import.meta.env.VITE_SERVER_URL}/auth/google`, {
          code: codeResponse.code,
        });
        const { access_token, refresh_token, user_uid } = authResponse.data;
        loginUser(access_token, refresh_token, user_uid);
        showToast({
          title: "Success",
          msg: "Logged in successfully with Google.",
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
      <div className="flex flex-col justify-center items-center font-mono text-green-500">
        <h1 className="mb-6 font-bold text-4xl">[ Login_ ]</h1>
        <Formik
          initialValues={{
            email: "",
            password: "",
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="bg-gray-900 shadow-lg p-6 border border-green-500 rounded-lg w-[24rem] max-w-full">
              {/* Email Field */}
              <div className="mb-4">
                <label htmlFor="email" className="text-green-300">
                  Email:
                </label>
                <Field
                  type="email"
                  name="email"
                  className="bg-gray-800 mt-1 p-2 border border-green-500 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-full text-green-300"
                />
                <ErrorMessage name="email" component="div" className="mt-1 text-rose-500" />
              </div>
              {/* Password Field */}
              <div className="mb-6">
                <label htmlFor="password" className="text-green-300">
                  Password:
                </label>
                <Field
                  type="password"
                  name="password"
                  className="bg-gray-800 mt-1 p-2 border border-green-500 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-full text-green-300"
                />
                <ErrorMessage name="password" component="div" className="mt-1 text-rose-500" />
              </div>
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="bg-green-500 hover:bg-green-600 py-2 rounded-lg w-full text-black transition"
              >
                {isLoading ? "Logging In..." : "[ Log_In ]"}
              </button>
            </Form>
          )}
        </Formik>

        <div className="flex items-center my-6 w-full">
          <div className="flex-grow bg-green-500 h-px"></div>
          <span className="mx-4">or</span>
          <div className="flex-grow bg-green-500 h-px"></div>
        </div>

        <button
          onClick={() => handleGoogleLogin()}
          className="flex justify-center items-center space-x-3 bg-gray-900 hover:bg-gray-800 mb-6 py-2 rounded-lg w-full text-green-300 transition"
        >
          <FontAwesomeIcon icon={faGoogle} className="text-xl" />
          <span>[ Continue_With_Google ]</span>
        </button>

        <p className="mt-4 text-green-500 text-xs">
          Don&apos;t have an account yet?{" "}
          <a href="/signup" className="text-green-300 hover:underline">
            [ Sign Up ]
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
