import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  BarChart3,
  LogOut,
  Menu,
  X,
  Store,
  ChevronRight,
  UserCircle,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

const navItems = [
  { to: '/',          label: 'Dashboard',  icon: LayoutDashboard, end: true  },
  { to: '/orders',    label: 'Orders',     icon: ClipboardList,   end: false },
  { to: '/menu',      label: 'Menu',       icon: UtensilsCrossed, end: false },
  { to: '/analytics', label: 'Analytics',  icon: BarChart3,       end: false },
  { to: '/profile',   label: 'Profile',    icon: UserCircle,      end: false },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, store, logout } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItems = () => (
    <ul className="flex-1 space-y-1 px-3 py-4">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border-l-2 border-emerald-500 pl-[10px]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              )
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            <span>{label}</span>
            <ChevronRight
              size={14}
              className="ml-auto opacity-0 group-[.active]:opacity-50 transition-opacity"
            />
          </NavLink>
        </li>
      ))}
      {/* Theme Toggle in Menu */}
      <li className="pt-4 border-t border-slate-800 mt-4">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </li>
    </ul>
  );

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={clsx(
        'flex flex-col bg-slate-900 border-r border-slate-800',
        mobile ? 'w-64 h-full' : 'hidden lg:flex w-64 shrink-0'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Store size={20} className="text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-100 leading-tight">Merchant Portal</p>
          <p className="text-xs text-slate-500 truncate max-w-[130px]">
            {store?.name ?? 'F&G Platform'}
          </p>
        </div>
      </div>

      <NavItems />

      {/* User card */}
      <div className="px-4 pb-4 shrink-0">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? 'M'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name ?? 'Merchant'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="text-slate-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-200">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 flex">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-16 bg-slate-900 border-b border-slate-800 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            className="text-slate-400 hover:text-slate-100"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <Store size={18} className="text-emerald-400" />
            <span className="text-sm font-semibold text-slate-100">Merchant Portal</span>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
