import React from "react";

const Spinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-16 h-16 border-4 border-green-500 border-dotted rounded-full animate-spin"></div>
    </div>
  );
};

export default Spinner;