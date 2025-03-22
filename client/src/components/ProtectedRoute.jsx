import React, { useContext } from "react";
import { Navigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";
import Spinner from "./Spinner";


const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  console.log("isAuthenticated", isAuthenticated);

  if (loading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
