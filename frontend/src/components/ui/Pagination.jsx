import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ page, pages, onPageChange }) => {
  if (pages <= 1) return null;

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(pages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2 mr-2 rounded-xl text-dark-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-dark-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none disabled:hover:border-transparent disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {getPageNumbers().map((num) => (
        <button
          key={num}
          onClick={() => onPageChange(num)}
          className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all flex items-center justify-center ${
            num === page
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
              : 'text-dark-600 bg-white border border-dark-100 hover:bg-dark-50'
          }`}
        >
          {num}
        </button>
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        className="p-2 ml-2 rounded-xl text-dark-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-dark-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none disabled:hover:border-transparent disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Pagination;
