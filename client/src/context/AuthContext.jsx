import axios from "axios";
import React, { useState, useEffect } from "react";
import { createContext } from "react";

import { setCookie, getCookie } from "../utils/cookies";

export const AuthContext = createContext();

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userUid, setUserUid] = useState(null);

  useEffect(() => {
    const accessToken = getCookie("access_token");
    const refreshToken = getCookie("refresh_token");

    const verifyToken = async () => {
      if (accessToken) {
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_SERVER_URL}/auth/verify-token`,
            { token: accessToken },
          );
          setUserUid(response.data.user_uid);
          setIsAuthenticated(true);
        } catch (error) {
          // Token verification failed, try refreshing with refresh_token
          if (refreshToken) {
            try {
              const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/auth/refresh-token`,
                {
                  token: refreshToken,
                },
              );
              // Set the new access token in cookies
              setCookie("access_token", response.data.access_token);
              setIsAuthenticated(true);
            } catch (refreshError) {
              // Both token verification and refresh failed
              setIsAuthenticated(false);
            }
          } else {
            setIsAuthenticated(false);
          }
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    verifyToken();
  }, []);

  return { isAuthenticated, userUid, setIsAuthenticated, setUserUid };
};

export const AuthProvider = ({ children }) => {
  const { isAuthenticated, userUid, setIsAuthenticated, setUserUid } = useAuth();

  const loginUser = (access_token, refresh_token, user_uid) => {
    setCookie("access_token", access_token);
    setCookie("refresh_token", refresh_token);
    setIsAuthenticated(true);
    setUserUid(user_uid);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userUid, loginUser }}>
      {children}
    </AuthContext.Provider>
  );
};
