import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getCookie } from "../utils/cookies";

function Navbar() {
  const [user, setUser] = useState({ username: "", avatar: null });
  const [loading, setLoading] = useState(true);
  const accessToken = getCookie("access_token");

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/user/info?keys=username,avatar`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        const data = response.data;
        setUser({
          username: data.username,
          avatar: data.avatar || null,
        });
        console.log("User info fetched:", data);
      } catch (error) {
        console.error("Error fetching user info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  return (
    <div className="bg-black text-green-500 font-mono p-4">
      <nav className="border-1 border-green-700 p-4">
        <div className="flex justify-between items-center">
          <div className="text-xl ps-3">
            {loading ? (
              <div className="w-50 h-6 bg-green-500/50 rounded-md animate-pulse" />
            ) : (
              <Link to="/dashboard" className="font-bold hover:text-green-300 hover:underline">
                Gary's Gallery / {user.username}
              </Link>
            )}
          </div>
          <div className="space-x-4 flex items-center pe-3">
            {loading ? (
              <div className="w-10 h-10 rounded-full bg-gray-800 animate-pulse" />
            ) : user.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                className="w-10 h-10 rounded-full hover:ring-2 hover:ring-green-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:ring-2 hover:ring-green-700">
                <span className="text-green-300">?</span>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
