import { useEffect, useState } from "react";

import axios from "axios";

import { getCookie } from "../utils/cookies";

// Simple spinner component
const Spinner = () => (
  <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
);

// Formats ISO date string into human-readable form
const formatDate = dateString => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function ImageCard({ imageUid }) {
  const [imageDetail, setImageDetail] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [thumbLoading, setThumbLoading] = useState(true);

  useEffect(() => {
    const fetchImageInfo = async () => {
      const access_token = getCookie("access_token");
      try {
        const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/image/info/${imageUid}`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });

        setImageDetail({
          title: res.data.title || "Untitled",
          file_name: res.data.file_name || "",
          labels: res.data.labels || [],
          created_at: res.data.created_at || "",
          thumbnail_url: `${import.meta.env.VITE_SERVER_URL}/image/thumbnail/${imageUid}`,
        });
      } catch (err) {
        console.error(`Error fetching info for ${imageUid}:`, err);
        setImageDetail({
          title: "Error loading image",
          file_name: "",
          labels: [],
          created_at: "",
          thumbnail_url: "",
        });
      } finally {
        setLoadingInfo(false);
      }
    };

    fetchImageInfo();
  }, [imageUid]);

  if (loadingInfo || !imageDetail) {
    // Placeholder while fetching metadata
    return (
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
  }

  return (
    <div className="border border-green-700 bg-gray-900 bg-opacity-30 overflow-hidden hover:border-green-500 transition-colors duration-200">
      <div className="aspect-video bg-gray-800 overflow-hidden relative">
        {thumbLoading && (
          <div className="absolute inset-0 bg-black flex justify-center items-center z-10">
            <Spinner />
          </div>
        )}

        <img
          src={imageDetail.thumbnail_url}
          alt={imageDetail.title}
          className="w-full h-full object-cover bg-gray-800"
          onLoad={() => setThumbLoading(false)}
          onError={() => setThumbLoading(true)}
        />
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-green-300 font-semibold text-sm truncate flex-shrink-0" title={imageDetail.title}>
            {imageDetail.title}
          </h3>
          <p className="text-xs text-gray-400 truncate min-w-0" title={imageDetail.file_name}>
            {imageDetail.file_name}
          </p>
        </div>

        {imageDetail.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {imageDetail.labels.slice(0, 3).map((label, idx) => (
              <span
                key={idx}
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

        <div className="text-xs text-green-400 opacity-70">{formatDate(imageDetail.created_at)}</div>
      </div>
    </div>
  );
}

export default ImageCard;
