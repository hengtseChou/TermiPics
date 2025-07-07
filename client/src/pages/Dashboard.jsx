import React, { useEffect, useState } from "react";

import axios from "axios";
import { Upload } from "lucide-react";

import Modal from "../components/ImageUpload";
import Navbar from "../components/Navbar";
import showToast from "../components/Notification";
import RollingAsciiAnimation from "../components/RollingArt";
import { getCookie } from "../utils/cookies";

function Dashboard() {
  const [initializing, setInitializing] = useState(true);
  const [isModalOpened, setIsModalOpened] = useState(false);

  const [username, setUsername] = useState(null);
  const [imageCount, setImageCount] = useState(null);
  const [allLabels, setAllLabels] = useState([]);

  const imagesPerPage = 50;
  const [images, setImages] = useState([]);
  const [imageDetails, setImageDetails] = useState({});
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
      fetchImages();
    }
  }, [imageCount]);

  // Fetch images when toggledLabels, page, sortBy, or sortOrder changes
  useEffect(() => {
    if (imageCount > 0) {
      fetchImages();
    }
  }, [toggledLabels, page, sortBy, sortOrder]);

  const fetchImages = async () => {
    const access_token = getCookie("access_token");
    try {
      const labels = toggledLabels.length > 0 ? toggledLabels.join(",") : "";
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/user/images`, {
        params: { page: page, sort_by: sortBy, sort_order: sortOrder, labels: labels },
        headers: { Authorization: `Bearer ${access_token}` },
      });
      setImages(response.data.image_uid);

      // Fetch detailed info for each image
      response.data.image_uid.forEach(image => {
        fetchImageInfo(image);
      });
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  const fetchImageInfo = async imageUid => {
    const access_token = getCookie("access_token");
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/image/info/${imageUid}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      // Create image detail object
      const imageDetail = {
        title: response.data.title || "Untitled",
        file_name: response.data.file_name || "",
        labels: response.data.labels || [],
        created_at: response.data.created_at || "",
        updated_at: response.data.updated_at || "",
        image_uid: imageUid,
        original_url: response.data.original_url || "",
        thumbnail_url: `${import.meta.env.VITE_SERVER_URL}/image/thumbnail/${imageUid}`,
      };

      setImageDetails(prev => ({
        ...prev,
        [imageUid]: imageDetail,
      }));
    } catch (error) {
      console.error(`Error fetching image info for ${imageUid}:`, error);
      // Set placeholder data on error
      setImageDetails(prev => ({
        ...prev,
        [imageUid]: {
          title: "Error loading image",
          file_name: "",
          labels: [],
          created_at: "",
          updated_at: "",
          image_uid: imageUid,
          original_url: "",
          thumbnail_url: "",
        },
      }));
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

  const clearAllLabels = () => {
    setToggledLabels([]);
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

  // Spinner component for loading thumbnails
  const Spinner = () => (
    <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
  );

  // State to track image loading status
  const [imageLoadingStates, setImageLoadingStates] = useState({});

  // Placeholder component for loading state
  const ImageCardPlaceholder = () => (
    <div className="border border-green-700 bg-gray-900 bg-opacity-30 overflow-hidden animate-pulse">
      <div className="aspect-video bg-black flex items-center justify-center">
        <Spinner />
      </div>
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="flex gap-1">
          <div className="h-5 bg-gray-700 rounded-full w-12"></div>
          <div className="h-5 bg-gray-700 rounded-full w-16"></div>
        </div>
        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );

  // Format date for display
  const formatDate = dateString => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col bg-black min-h-screen font-mono text-green-500">
      <Navbar />
      <div className="flex-grow gap-4 grid grid-cols-9 mx-4 mb-6">
        {/* column 1 */}
        <div className="col-span-2 p-4 border border-green-700">
          {initializing ? (
            <div className="flex justify-center items-center h-full">
              <p>Loading...</p>
            </div>
          ) : (
            <RollingAsciiAnimation />
          )}
        </div>
        {/* column 2 */}
        <div className="col-span-5 p-4 border border-green-700">
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
              <div className="grid grid-cols-3 gap-4">
                {images.map((imageUid, index) => {
                  const imageDetail = imageDetails[imageUid];

                  // Show placeholder while loading
                  if (!imageDetail) {
                    return <ImageCardPlaceholder key={index} />;
                  }

                  return (
                    <div
                      key={index}
                      className="border border-green-700 bg-gray-900 bg-opacity-30 overflow-hidden hover:border-green-500 transition-colors duration-200"
                    >
                      {/* Image container */}
                      <div className="aspect-video bg-gray-800 overflow-hidden relative">
                        {/* Loading spinner - shown while image is loading */}
                        {imageLoadingStates[imageUid] !== false && (
                          <div className="absolute inset-0 bg-black flex justify-center items-center z-10">
                            <Spinner />
                          </div>
                        )}

                        <img
                          src={imageDetail.thumbnail_url}
                          alt="" // Empty alt to prevent text from showing
                          className="w-full h-full object-cover bg-gray-800"
                          style={{ backgroundColor: "#1f2937" }} // Tailwind's gray-800
                          onLoad={() => {
                            // Image loaded successfully
                            setImageLoadingStates(prev => ({ ...prev, [imageUid]: false }));
                          }}
                          onError={() => {
                            // Image failed to load, keep spinner visible
                            setImageLoadingStates(prev => ({ ...prev, [imageUid]: true }));
                          }}
                        />
                      </div>

                      {/* Card content */}
                      <div className="p-3 space-y-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3
                            className="text-green-300 font-semibold text-sm truncate flex-shrink-0"
                            title={imageDetail.title}
                          >
                            {imageDetail.title}
                          </h3>
                          <p className="text-xs text-gray-400 truncate min-w-0" title={imageDetail.file_name}>
                            {imageDetail.file_name}
                          </p>
                        </div>

                        {/* Labels */}
                        {imageDetail.labels && imageDetail.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {imageDetail.labels.slice(0, 3).map((label, labelIndex) => (
                              <span
                                key={labelIndex}
                                className="px-2 py-1 bg-green-500 bg-opacity-20 border border-green-600 text-green-300 text-xs rounded-full"
                              >
                                {label}
                              </span>
                            ))}
                            {imageDetail.labels.length > 3 && (
                              <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                                +{imageDetail.labels.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Date */}
                        <div className="text-xs text-green-400 opacity-70">{formatDate(imageDetail.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        {/* column 3 */}
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
