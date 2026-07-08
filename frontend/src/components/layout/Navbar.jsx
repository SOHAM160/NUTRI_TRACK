import { Menu, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getInitials } from '../../utils/helpers';
import toast from 'react-hot-toast';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-[76px] bg-[#050505]/80 backdrop-blur-xl border-b border-dark-border flex items-center justify-between px-5 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-dark-surface lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-5">
        <button onClick={() => toast('No new notifications', { icon: '🔔' })} className="p-2 text-gray-400 hover:text-white transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-orange-500 rounded-full"></span>
        </button>

        <div className="h-6 w-px bg-dark-border"></div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right mr-2">
            <p className="text-sm font-semibold text-white leading-tight">{user?.name}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{user?.email}</p>
          </div>
          
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-dark-surface"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center">
              <span className="text-xs font-bold text-gray-300">{getInitials(user?.name)}</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="p-2 ml-1 rounded-xl text-gray-400 hover:bg-dark-surface hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
