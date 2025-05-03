import React, { useEffect, useState } from "react";

import axios from "axios";
import { Upload } from "lucide-react";

import Modal from "../components/ImageUpload";
import Navbar from "../components/Navbar";
import RollingAsciiAnimation from "../components/RollingArt";
import { getCookie } from "../utils/cookies";

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [isModalOpened, setIsModalOpened] = useState(false);

  const [username, setUsername] = useState(null);
  const [imageCount, setImageCount] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [images, setImages] = useState([]);

  // TODO: a function to fetch image with pagination
  // TODO: a function to clear up the image list

  useEffect(() => {
    const fetchUserInfo = async () => {
      const access_token = getCookie("access_token");
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/info`, {
          params: { keys: "images,username" },
          headers: { Authorization: `Bearer ${access_token}` },
        });
        setImageCount(response.data.images);
        setUsername(response.data.username);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching image count:", error);
      }
    };
    fetchUserInfo();
  }, []);

  const openModal = () => {
    setIsModalOpened(true);
  };

  const closeModal = () => {
    setIsModalOpened(false);
  };

  const handleImageUpload = async newUpload => {
    const access_token = getCookie("access_token");
    try {
      const formData = new FormData();
      formData.append("file", newUpload.file);
      formData.append("title", newUpload.title);
      formData.append("labels", newUpload.labels);

      await axios.post(`${import.meta.env.VITE_SERVER_URL}/images/upload`, formData, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      closeModal();
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

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
                  <button
                    onClick={openModal}
                    className="bg-gray-900 hover:bg-gray-800 mx-2 px-4 py-2 border border-green-300 rounded-xl text-green-300 cursor-pointer"
                  >
                    <Upload size={20} className="mx-2" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <p>Explore your uploaded images below.</p>
              {/* Gallery content would go here */}
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
      <Modal isOpened={isModalOpened} onClose={closeModal} onUpload={handleImageUpload} />
    </div>
  );
}

export default Dashboard;
