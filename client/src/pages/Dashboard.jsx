import React, { useEffect, useState } from "react";

import { faArrowUpFromBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";

import Navbar from "../components/Navbar";
import RollingAsciiAnimation from "../components/RollingArt";
import { getCookie } from "../utils/cookies";

function Dashboard() {
  const [imageCount, setImageCount] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const access_token = getCookie("access_token");
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/user/info?keys=images,username`,
          { headers: { Authorization: `Bearer ${access_token}` } }
        );
        setImageCount(response.data.images);
        setUsername(response.data.username);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching image count:", error);
      }
    };

    fetchUserInfo();
  }, []);

  return (
    <div className="flex flex-col bg-black min-h-screen font-mono text-green-500">
      <Navbar />
      <div className="flex-grow gap-4 grid grid-cols-9 mx-4 mb-6">
        {/* column 1 */}
        <div className="col-span-2 p-4 border border-green-700">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <p>Loading...</p>
            </div>
          ) : (
            <RollingAsciiAnimation />
          )}
        </div>
        {/* column 2 */}
        <div className="col-span-5 p-4 border border-green-700">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <p>Loading...</p>
            </div>
          ) : imageCount === 0 ? (
            <>
              <div className="p-4">
                <h1 className="text-3xl text-start">Hello {username}!</h1>
                <div className="flex items-center mt-6">
                  <span>Click the button to upload your first image.</span>
                  <button className="bg-gray-900 hover:bg-gray-800 mx-2 px-4 py-2 border border-green-300 rounded-xl w-20 text-green-300 cursor-pointer">
                    <FontAwesomeIcon icon={faArrowUpFromBracket} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-xl text-center">Your Gallery</h1>
              <p className="text-center">Explore your uploaded images below.</p>
            </>
          )}
        </div>
        {/* column 3 */}
        <div className="col-span-2 p-4 border border-green-700">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <p>Loading...</p>
            </div>
          ) : imageCount === 0 ? (
            <>
              <div>
                <p>emptyness...</p>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-xl text-center">Labels</h1>
              <p className="text-center">Explore your uploaded images below.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
