import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', loading = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-[20px] shadow-2xl max-w-md w-full p-7 sm:p-8 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-dark-400 hover:text-dark-600 hover:bg-dark-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-5 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center flex-shrink-0 ring-4 ring-rose-50/50">
            <AlertTriangle className="w-7 h-7 text-rose-500" />
          </div>
          <div className="pt-1">
            <h3 className="text-xl font-bold text-dark-900 tracking-tight leading-tight">{title}</h3>
            <p className="text-[14px] text-dark-500 mt-2 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button onClick={onClose} className="btn-secondary w-full sm:w-auto px-6 py-2.5" disabled={loading}>
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-danger w-full sm:w-auto px-6 py-2.5" disabled={loading}>
            {loading ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
