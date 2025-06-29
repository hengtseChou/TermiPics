import React, { useEffect, useState } from "react";

import { Image as ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";

import showToast from "./Notification";

function Modal({ isOpened, onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [labels, setLabels] = useState("");

  const [preview, setPreview] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [fileSize, setFileSize] = useState(0);

  // isOpened: A prop passed from the parent component that controls whether the modal should be shown or hidden
  // isVisible: A local state that determines if the modal is actually rendered in the DOM
  const [isVisible, setIsVisible] = useState(false);
  const ANIMATION_STATES = {
    ENTER: "enter",
    LEAVE: "leave",
    IDLE: null,
  };
  const [animation, setAnimation] = useState(ANIMATION_STATES.IDLE);
  const [uploadDisabled, setUploadDisabled] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
    },
    onDrop: acceptedFiles => {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setFileSize(selectedFile.size);

      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);

      const img = new Image();
      img.onload = () => {
        setDimensions({
          width: img.width,
          height: img.height,
        });
      };
      img.src = objectUrl;
    },
  });

  useEffect(() => {
    if (!file || !title) {
      setUploadDisabled(true);
    } else {
      setUploadDisabled(false);
    }
  }, [file, title]);

  useEffect(() => {
    if (fileSize > 1000 * 1000 * 10) {
      setUploadDisabled(true);
      showToast({
        title: "Error",
        msg: "File size exceeds the limit of 10MB",
        type: "error",
      });
    }
  }, [file]);

  // Handle opening the modal
  useEffect(() => {
    if (isOpened && !isVisible) {
      setIsVisible(true);
      setAnimation(ANIMATION_STATES.ENTER);
    }
  }, [isOpened, isVisible]);

  // Handle closing the modal when parent sets isOpened to false
  useEffect(() => {
    if (!isOpened && isVisible) {
      handleClose();
    }
  }, [isOpened, isVisible]);

  const handleClose = () => {
    setAnimation(ANIMATION_STATES.LEAVE);
    setTimeout(() => {
      resetForm();
      setIsVisible(false);
      setAnimation(ANIMATION_STATES.IDLE);
      // Only call onClose if the modal is actually being closed by user action
      // (not when parent already set isOpened to false)
      if (isOpened) {
        onClose();
      }
    }, 300);
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setTitle("");
    setLabels("");
    setDimensions({ width: 0, height: 0 });
    setFileSize(0);
    setIsUploading(false);
    setUploadDisabled(true);
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadDisabled(true);

    try {
      // Call the parent's onUpload function
      await onUpload({
        file,
        title,
        labels,
      });

      // Upload successful - parent will handle closing the modal
      // Don't reset isUploading here, let the close animation handle it
    } catch (error) {
      // If upload fails, reset the uploading state
      setIsUploading(false);
      setUploadDisabled(false);
      showToast({
        title: "Error",
        msg: "Failed to upload image",
        type: "error",
      });
    }
  };

  if (!isVisible && !isOpened) return null;

  return (
    <div
      className="z-50 fixed inset-0 flex justify-center items-center bg-black/70 duration-300 animation-opacity"
      style={{ opacity: animation === ANIMATION_STATES.ENTER ? "1" : "0" }}
    >
      {/* Modal container */}
      <div
        className={`bg-gray-900 mx-4 border border-green-700 rounded-lg w-full max-w-md overflow-hidden animation-all duration-300 transform ${
          animation === ANIMATION_STATES.ENTER ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
      >
        {/* Modal header */}
        <div className="flex justify-between items-center px-6 py-4 border-green-700 border-b">
          <h3 className="font-medium text-green-500 text-lg">Upload Image</h3>
          <button
            type="button"
            onClick={handleClose}
            className="text-green-500 hover:text-green-400 animation-colors"
            disabled={isUploading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-4">
          {!file ? (
            <div
              {...getRootProps()}
              className={`border border-dashed rounded-lg p-6 text-center cursor-pointer animation-colors ${
                isDragActive ? "border-green-500 bg-gray-800" : "border-green-700 hover:border-green-600"
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col justify-center items-center space-y-2">
                <ImageIcon className="w-12 h-12 text-green-300" />
                <p className="text-green-300 text-sm">Drag and drop your image here, or click to select</p>
                <p className="text-green-500 text-xs">Supported formats: JPEG, JPG, PNG</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Form fields */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block mb-1 font-medium text-green-300 text-sm">
                    Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="bg-gray-800 px-3 py-2 rounded-md focus:outline-none w-full text-green-300"
                    placeholder=""
                    disabled={isUploading}
                  />
                </div>

                <div>
                  <label htmlFor="labels" className="block mb-1 font-medium text-green-300 text-sm">
                    Labels
                  </label>
                  <input
                    id="labels"
                    type="text"
                    value={labels}
                    onChange={e => setLabels(e.target.value)}
                    className="bg-gray-800 px-3 py-2 rounded-md focus:outline-none w-full text-green-300"
                    placeholder="Enter labels separated by commas"
                    disabled={isUploading}
                  />
                </div>
              </div>

              {/* Image preview */}
              <div className="mt-4">
                <p className="mb-2 font-medium text-green-300 text-sm">Preview</p>
                <div className="p-2 border border-green-700 rounded-md">
                  <img src={preview} alt="Preview" className="w-full max-h-48 object-contain" />
                  <p className="mt-1 text-green-700 text-xs text-center">
                    {file.name}{" "}
                    {dimensions.width > 0 &&
                      `(${dimensions.width}×${dimensions.height}px, ${Math.round(fileSize / 1000 / 100) / 10} MB)`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex justify-end bg-gray-900 px-6 py-4 border-green-700 border-t">
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploadDisabled || isUploading}
            className={`flex items-center px-4 py-2 rounded-md ${
              uploadDisabled || isUploading
                ? "bg-gray-700 cursor-not-allowed text-gray-500"
                : "bg-gray-800 hover:bg-gray-700 text-green-300 hover:cursor-pointer"
            } animation-colors`}
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
