import React, { useState, useEffect } from "react";

import axios from "axios";

import { AuthContext } from "./AuthContext";
import { getCookie, setCookie } from "../utils/cookies";

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userUid, setUserUid] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshAccessToken = async refreshToken => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/auth/refresh-token`, {
        token: refreshToken,
      });
      setCookie("access_token", response.data.access_token);
      setCookie("refresh_token", response.data.refresh_token);
      setUserUid(response.data.user_uid);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      setIsAuthenticated(false);
      return false;
    }
  };

  const verifyAccessToken = async accessToken => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/auth/verify-token`, {
        token: accessToken,
      });
      setUserUid(response.data.user_uid);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    const handleAuthentication = async () => {
      const accessToken = getCookie("access_token");
      const refreshToken = getCookie("refresh_token");

      if (accessToken) {
        const isVerified = await verifyAccessToken(accessToken);
        if (!isVerified && refreshToken) {
          await refreshAccessToken(refreshToken);
        }
      } else if (refreshToken) {
        await refreshAccessToken(refreshToken);
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };
    handleAuthentication();
  }, []);

  return { isAuthenticated, userUid, loading, setIsAuthenticated, setUserUid };
};

export const AuthProvider = ({ children }) => {
  const { isAuthenticated, userUid, loading, setIsAuthenticated, setUserUid } = useAuth();

  const loginUser = (access_token, refresh_token, user_uid) => {
    setCookie("access_token", access_token);
    setCookie("refresh_token", refresh_token);
    setIsAuthenticated(true);
    setUserUid(user_uid);
  };

  const logoutUser = () => {
    setCookie("access_token", "", { expires: -1 });
    setCookie("refresh_token", "", { expires: -1 });
    setIsAuthenticated(false);
    setUserUid(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userUid, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};
