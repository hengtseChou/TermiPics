import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

import axios from "axios";

import { getCookie } from "../utils/cookies";

function Navbar() {
  const [user, setUser] = useState({ username: "", avatar: null });
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const avatarRef = useRef(null);
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
  }, [accessToken]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownOpen || avatarRef.current?.contains(event.target)) {
        return;
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <div className="bg-black p-4 font-mono text-green-500">
      <nav className="p-4 border-1 border-green-700">
        <div className="flex justify-between items-center">
          <div className="ps-3 text-xl">
            {loading ? (
              <div className="bg-green-500/50 rounded-md w-50 h-6 animate-pulse" />
            ) : (
              <Link
                to="/dashboard"
                className="font-bold hover:text-green-300 hover:underline cursor-pointer"
              >
                Gary&apos;s Gallery / {user.username}
              </Link>
            )}
          </div>
          <div className="flex items-center space-x-4 pe-3">
            <div className="relative">
              {loading ? (
                <div className="bg-gray-800 rounded-full w-10 h-10 animate-pulse" />
              ) : (
                <div ref={avatarRef} onClick={toggleDropdown} className="relative">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="rounded-full hover:ring-2 hover:ring-green-700 w-10 h-10 cursor-pointer"
                    />
                  ) : (
                    <div className="flex justify-center items-center bg-gray-800 rounded-full hover:ring-2 hover:ring-green-700 w-10 h-10 cursor-pointer">
                      <span className="text-green-300">?</span>
                    </div>
                  )}
                </div>
              )}
              {dropdownOpen && !loading && (
                <div
                  ref={dropdownRef}
                  className="right-0 z-10 absolute bg-gray-900 shadow-lg mt-2 border border-green-700 rounded-md w-48"
                >
                  <ul className="py-1">
                    <li className="hover:bg-gray-800 px-4 py-2 cursor-pointer">
                      <Link to="/settings" className="block w-full text-green-300">
                        Settings
                      </Link>
                    </li>
                    <li className="hover:bg-gray-800 px-4 py-2 cursor-pointer">
                      <Link to="/logout" className="block w-full text-green-300">
                        Logout
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
