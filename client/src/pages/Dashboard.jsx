import { useEffect, useState } from "react";

import axios from "axios";
import { Upload } from "lucide-react";

import ImageCard from "../components/ImageCard";
import Modal from "../components/ImageUpload";
import Navbar from "../components/Navbar";
import showToast from "../components/Notification";
import Pagination from "../components/Pagination";
import RollingAsciiAnimation from "../components/RollingArt";
import { getCookie } from "../utils/cookies";

function Dashboard() {
  const [initializing, setInitializing] = useState(true);
  const [isModalOpened, setIsModalOpened] = useState(false);

  const [username, setUsername] = useState(null);
  const [imageCount, setImageCount] = useState(null);
  const [allLabels, setAllLabels] = useState([]);

  const imagesPerPage = 30;
  const [imageUIDs, setImageUIDs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [toggledLabels, setToggledLabels] = useState([]);

  useEffect(() => {
    pageInitialize();
  }, []);

  const pageInitialize = async () => {
    const access_token = getCookie("access_token");
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/info`, {
        params: { keys: "image_count,labels" },
        headers: { Authorization: `Bearer ${access_token}` },
      });
      setImageCount(response.data.image_count);
      setAllLabels(response.data.labels);
      setInitializing(false);
    } catch (error) {
      console.error("Error fetching user info while page initialize:", error);
    }
  };

  useEffect(() => {
    if (imageCount > 0) {
      setTotalPages(Math.ceil(imageCount / imagesPerPage));
      fetchImageUIDs();
    }
  }, [imageCount]);

  // Fetch images when toggledLabels, page, sortBy, or sortOrder changes
  useEffect(() => {
    if (imageCount > 0) {
      fetchImageUIDs();
    }
  }, [toggledLabels, page, sortBy, sortOrder]);

  const fetchImageUIDs = async () => {
    const access_token = getCookie("access_token");
    try {
      const labels = toggledLabels.length > 0 ? toggledLabels.join(",") : "";
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/images`, {
        params: { page: page, sort_by: sortBy, sort_order: sortOrder, labels: labels },
        headers: { Authorization: `Bearer ${access_token}` },
      });
      setImageUIDs(response.data.image_uid);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  const toggleLabel = label => {
    setToggledLabels(prev => {
      if (prev.includes(label)) {
        return prev.filter(l => l !== label);
      } else {
        return [...prev, label];
      }
    });
    // Reset to first page when filtering changes
    setPage(1);
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

      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/info`, {
        params: { keys: "image_count,labels" },
        headers: { Authorization: `Bearer ${access_token}` },
      });
      setImageCount(response.data.image_count);
      setAllLabels(response.data.labels);

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
        {/* left column */}
        <div className="col-span-2 p-4 border border-green-700">
          {initializing ? (
            <div className="flex justify-center items-center h-full">
              <p>Loading...</p>
            </div>
          ) : (
            <RollingAsciiAnimation />
          )}
        </div>
        {/* center column */}
        <div className="relative col-span-5 p-4 border border-green-700">
          {initializing ? (
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
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-green-700">
                <div className="flex items-center gap-4">
                  <button
                    onClick={openModal}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 px-4 py-2 border border-green-300 rounded-xl text-green-300 cursor-pointer transition-colors"
                  >
                    <Upload size={16} />
                    Upload
                  </button>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-green-500">Sort by:</label>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="bg-gray-900 border border-green-700 text-green-300 px-3 py-1 rounded focus:outline-none focus:border-green-500"
                    >
                      <option value="created_at">Date Created</option>
                      <option value="updated_at">Date Modified</option>
                      <option value="title">Title</option>
                      <option value="file_name">File Name</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-green-500">Order:</label>
                    <select
                      value={sortOrder}
                      onChange={e => setSortOrder(e.target.value)}
                      className="bg-gray-900 border border-green-700 text-green-300 px-3 py-1 rounded focus:outline-none focus:border-green-500"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Images Grid */}
              <div className="grid grid-cols-3 gap-4">
                {imageUIDs.map(uid => (
                  <ImageCard key={uid} imageUid={uid} />
                ))}
              </div>

              {/* Pagination */}
              <Pagination page={page} totalPages={totalPages} onPageChange={newPage => setPage(newPage)} />
            </>
          )}
        </div>
        {/* right column */}
        <div className="col-span-2 p-4 border border-green-700">
          {initializing ? (
            <div className="flex justify-center items-center h-full">
              <p>Loading...</p>
            </div>
          ) : imageCount === 0 ? (
            <>
              <div>
                <p>Tip: You can filter upload pictures by labels!</p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-start mb-2 ms-1">Filter by labels</p>
                </div>
                <div className="space-y-2">
                  {allLabels.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {allLabels.map((label, index) => (
                        <button
                          key={index}
                          onClick={() => toggleLabel(label)}
                          className={`px-3 py-1 rounded-full text-sm border transition-all duration-200 cursor-pointer ${
                            toggledLabels.includes(label)
                              ? "bg-green-500 bg-opacity-20 border-green-400 text-green-300 shadow-sm"
                              : "bg-transparent border-green-700 text-green-500 hover:border-green-500 hover:bg-green-900 hover:bg-opacity-10"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-green-400">No labels available</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Modal isOpened={isModalOpened} onClose={closeModal} onUpload={handleImageUpload} />
    </div>
  );
}

export default Dashboard;
