import { PackageOpen } from 'lucide-react';

const EmptyState = ({ icon: Icon = PackageOpen, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in bg-white border border-dark-100/60 shadow-sm rounded-2xl w-full">
      <div className="w-24 h-24 rounded-3xl bg-dark-50 flex items-center justify-center mb-6">
        <Icon className="w-12 h-12 text-dark-300" />
      </div>
      <h3 className="text-xl font-bold text-dark-800 mb-2.5 tracking-tight">{title}</h3>
      {description && <p className="text-[14px] text-dark-500 max-w-sm mb-8 leading-relaxed">{description}</p>}
      {action}
    </div>
  );
};

export default EmptyState;
