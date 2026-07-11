import { useEffect, useState } from 'react';
import { X, Trophy } from 'lucide-react';

const AchievementCelebrationModal = ({ achievement, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  if (!achievement) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div
        className={`relative z-10 w-full max-w-sm mx-4 transform transition-all duration-500 ${
          visible ? 'scale-100 translate-y-0' : 'scale-75 translate-y-10'
        }`}
      >
        <div className="bg-gradient-to-b from-[#1a1a2e] to-[#16213e] rounded-3xl border border-brand-orange-500/30 p-8 text-center shadow-[0_0_60px_rgba(234,88,12,0.2)]">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Confetti-style decorative elements */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            <div className="absolute -top-1 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="absolute -top-1 right-1/3 w-2 h-2 bg-brand-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            <div className="absolute top-2 left-1/3 w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-3 right-1/4 w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="absolute top-1 left-1/2 w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>

          {/* Trophy icon */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-orange-500 to-yellow-500 flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(234,88,12,0.4)] animate-pulse">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          {/* Badge emoji */}
          <div className="text-5xl mb-3 animate-bounce">{achievement.icon}</div>

          {/* Title */}
          <h3 className="text-xl font-bold bg-gradient-to-r from-brand-orange-500 to-yellow-400 bg-clip-text text-transparent mb-1">
            Achievement Unlocked!
          </h3>

          {/* Badge name */}
          <p className="text-2xl font-extrabold text-white mt-3 mb-2">
            {achievement.name}
          </p>

          {/* Description */}
          <p className="text-gray-400 text-sm mb-6">
            {achievement.description}
          </p>

          {/* CTA Button */}
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-orange-500 to-orange-600 text-white font-semibold hover:from-brand-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-brand-orange-500/20"
          >
            Awesome! 🎉
          </button>
        </div>
      </div>
    </div>
  );
};

export default AchievementCelebrationModal;
