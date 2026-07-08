import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeMap = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 className={`${sizeMap[size]} text-primary-500 animate-spin`} />
      {text && <p className="text-sm text-dark-500 font-medium">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
