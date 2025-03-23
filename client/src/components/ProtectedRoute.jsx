import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { PuffLoader } from "react-spinners";

import { AuthContext } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PuffLoader color="#10B981" size={150} /> {/* green 500 from tailwindcss */}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
