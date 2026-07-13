import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, BarChart3, User, X, Activity, Sparkles, ShoppingCart, Calendar } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/meals', icon: UtensilsCrossed, label: 'Meal Logging' },
  { to: '/dashboard/meal-planner', icon: Calendar, label: 'AI Meal Planner' },
  { to: '/dashboard/analytics', icon: BarChart3, label: 'Health Insights' },
  { to: '/dashboard/ai', icon: Sparkles, label: 'AI Nutritionist' },
  { to: '/dashboard/grocery', icon: ShoppingCart, label: 'Grocery List' },
  { to: '/dashboard/profile', icon: User, label: 'Profile' },
];

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#0a0a0a] border-r border-dark-border z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-[76px] flex items-center justify-between px-6 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-brand-orange-500 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </span>
              NutriCal <span className="text-brand-blue-500">Track</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-dark-surface lg:hidden transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 pt-8 pb-4 space-y-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-dark-surface text-brand-orange-500 border-l-2 border-brand-orange-500 shadow-sm'
                    : 'text-gray-400 hover:bg-dark-surface hover:text-gray-200'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
