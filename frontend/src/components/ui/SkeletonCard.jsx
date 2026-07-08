const SkeletonCard = ({ count = 1, className = '' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bg-white rounded-2xl p-7 shadow-sm border border-dark-100/60 ${className}`}>
          <div className="flex items-center gap-5 mb-5">
            <div className="skeleton w-14 h-14 rounded-[16px]" />
            <div className="flex-1 w-full">
              <div className="skeleton h-4 w-2/3 mb-2.5 rounded-lg" />
              <div className="skeleton h-3 w-1/3 rounded-md" />
            </div>
          </div>
          <div className="space-y-3.5">
            <div className="skeleton h-3 w-full rounded-md" />
            <div className="skeleton h-3 w-5/6 rounded-md" />
            <div className="skeleton h-3 w-3/4 rounded-md" />
          </div>
        </div>
      ))}
    </>
  );
};

export default SkeletonCard;
