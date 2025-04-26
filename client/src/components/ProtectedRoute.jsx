import React, { useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";

import { PuffLoader } from "react-spinners";

import showToast from "../components/Notification";
import { AuthContext } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      showToast({
        title: "Access Denied",
        msg: "Your session is invalid or has expired. Please log in again.",
        type: "error",
      });
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-black min-h-screen">
        <PuffLoader color="var(--color-green-500)" size={150} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
