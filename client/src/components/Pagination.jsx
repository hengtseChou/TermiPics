import { ChevronLeft, ChevronRight } from "lucide-react";

function Pagination({ page, totalPages, onPageChange }) {
  // Only show pagination if there are multiple pages
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black flex items-center justify-center gap-2 my-6">
      {/* Previous button */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={`flex items-center gap-1 px-3 py-2 rounded border transition-colors ${
          page === 1
            ? "border-gray-600 text-gray-600 cursor-not-allowed"
            : "border-green-700 text-green-400 hover:border-green-500 hover:bg-green-900 hover:bg-opacity-10"
        }`}
      >
        <ChevronLeft size={16} />
        <span className="text-sm">Previous</span>
      </button>

      {/* Page info box */}
      <div className="px-4 py-2 rounded border border-green-700 text-green-400 text-sm">
        {page} / {totalPages}
      </div>

      {/* Next button */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={`flex items-center gap-1 px-3 py-2 rounded border transition-colors ${
          page === totalPages
            ? "border-gray-600 text-gray-600 cursor-not-allowed"
            : "border-green-700 text-green-400 hover:border-green-500 hover:bg-green-900 hover:bg-opacity-10"
        }`}
      >
        <span className="text-sm">Next</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export default Pagination;
