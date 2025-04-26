import React, { useState } from "react";

import { X, Upload, Image } from "lucide-react";
import { useDropzone } from "react-dropzone";

function Modal({ isOpen, onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [labels, setLabels] = useState("");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
    },
    onDrop: (acceptedFiles) => {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);

      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    },
  });

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setTitle("");
    setDescription("");
    setLabels("");
  };

  const handleUpload = () => {
    onUpload({
      file,
      title,
      description,
      labels,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/70">
      {/* Modal container */}
      <div className="bg-gray-900 mx-4 border border-green-500 rounded-lg w-full max-w-md overflow-hidden">
        {/* Modal header */}
        <div className="flex justify-between items-center px-6 py-4 border-green-700 border-b">
          <h3 className="font-medium text-green-500 text-lg">Upload Image</h3>
          <button onClick={handleClose} className="text-green-400 hover:text-green-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-4">
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-green-500 bg-gray-800" : "border-green-700 hover:border-green-600"
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col justify-center items-center space-y-2">
                <Image className="w-12 h-12 text-green-400" />
                <p className="text-green-500 text-sm">Drag and drop your image here, or click to select</p>
                <p className="text-green-700 text-xs">Supported formats: JPG, PNG, GIF</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Form fields */}
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium text-green-500 text-sm">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-gray-800 px-3 py-2 border border-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-full text-green-400"
                    placeholder="Enter a title"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium text-green-500 text-sm">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="2"
                    className="bg-gray-800 px-3 py-2 border border-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-full text-green-400"
                    placeholder="Enter a description"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium text-green-500 text-sm">Labels</label>
                  <input
                    type="text"
                    value={labels}
                    onChange={(e) => setLabels(e.target.value)}
                    className="bg-gray-800 px-3 py-2 border border-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-full text-green-400"
                    placeholder="Enter labels separated by commas"
                  />
                </div>
              </div>

              {/* Image preview */}
              <div className="mt-4">
                <p className="mb-2 font-medium text-green-500 text-sm">Preview</p>
                <div className="p-2 border border-green-700 rounded-md">
                  <img src={preview} alt="Preview" className="w-full max-h-48 object-contain" />
                  <p className="mt-1 text-green-700 text-xs text-center">{file.name}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex justify-end bg-gray-900 px-6 py-4 border-green-700 border-t">
          <button
            onClick={handleUpload}
            disabled={!title || !file}
            className={`flex items-center px-4 py-2 rounded-md border ${
              !title || !file
                ? "bg-gray-700 border-gray-600 cursor-not-allowed text-gray-500"
                : "bg-gray-900 hover:bg-gray-800 border-green-500 text-green-500 hover:text-green-400"
            } transition-colors`}
          >
            <Upload size={16} className="mr-2" />
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
