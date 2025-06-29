import React, { useEffect, useState } from "react";

import axios from "axios";
import { Upload } from "lucide-react";

import Modal from "../components/ImageUpload";
import Navbar from "../components/Navbar";
import showToast from "../components/Notification";
import RollingAsciiAnimation from "../components/RollingArt";
import { getCookie } from "../utils/cookies";

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [isModalOpened, setIsModalOpened] = useState(false);

  const [username, setUsername] = useState(null);
  const [imageCount, setImageCount] = useState(null);
  const [allLabels, setAllLabels] = useState([]);

  const imagesPerPage = 50;
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [toggledLabels, setToggledLabels] = useState([]);
  // TODO: add states for image deletion

  useEffect(() => {
    pageInitialize();
  }, []);

  const pageInitialize = async () => {
    const access_token = getCookie("access_token");
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/info`, {
        params: { keys: "image_count" },
        headers: { Authorization: `Bearer ${access_token}` },
      });
      setImageCount(response.data.image_count);
      if (imageCount > 0) {
        setTotalPages(Math.ceil(imageCount / imagesPerPage));
        fetchImages();
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching image count:", error);
    }
  };

  const fetchImages = async () => {
    const access_token = getCookie("access_token");
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/images`, {
        params: { page: page, sort_by: sortBy, sort_order: sortOrder, labels: toggledLabels },
        headers: { Authorization: `Bearer ${access_token}` },
      });
      setImages(response.data.images);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

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

      await axios.post(`${import.meta.env.VITE_SERVER_URL}/image/upload`, formData, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      showToast({
        title: "Success",
        msg: "Image uploaded successfully",
        type: "success",
      });

      // Update the state first
      const newImageCount = imageCount + 1;
      setImageCount(newImageCount);
      setTotalPages(Math.ceil(newImageCount / imagesPerPage));

      // Refresh images if we have any
      if (newImageCount > 0) {
        fetchImages();
      }

      // Close modal - this will trigger the modal's closing animation
      closeModal();
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast({
        title: "Error",
        msg: error.response?.data?.message || "Failed to upload image",
        type: "error",
      });
      // Important: throw the error so Modal can reset its loading state
      throw error;
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
              <div className="grid grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="border border-green-700 p-2">
                    <img src={image.url} alt={image.title} className="w-full h-auto object-cover" />
                  </div>
                ))}
              </div>
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
