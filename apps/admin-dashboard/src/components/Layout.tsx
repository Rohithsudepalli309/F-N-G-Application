import React from 'react';
import { Navigate, Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Users, Store, Truck, LogOut, Zap } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

// ── Protected Route Guard ──────────────────────────────────────────────────
export const ProtectedRoute = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// ── Admin Layout ────────────────────────────────────────────────────────────
export const AdminLayout = () => {
  const user = useAuthStore((state: any) => state.user);
  const logout = useAuthStore((state: any) => state.logout);

  const navItems = [
    { label: 'Dashboard',   path: '/',        icon: LayoutDashboard },
    { label: 'Live Orders', path: '/orders',   icon: ShoppingBag },
    { label: 'Users',       path: '/users',    icon: Users },
    { label: 'Stores',      path: '/stores',   icon: Store },
    { label: 'Drivers',     path: '/drivers',  icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 shadow-2xl z-20">

        {/* Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <span className="text-white font-black text-sm">F</span>
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">FNG Admin</span>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Control Centre</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `relative flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm font-medium
                ${isActive
                  ? 'bg-gradient-to-r from-orange-500/15 to-transparent text-orange-400 border-l-2 border-orange-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border-l-2 border-transparent'
                }`
              }
            >
              <item.icon
                size={18}
                className="mr-3 flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
              />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-3 px-1">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-xs font-bold uppercase ring-2 ring-slate-700">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Super Admin</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white px-3 py-2 rounded-lg transition-all duration-200 text-xs font-bold border border-red-500/20 hover:border-red-600"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen">

        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 flex items-center px-8 sticky top-0 z-10 justify-between shadow-sm">
          <h1 className="text-base font-bold text-slate-800 tracking-tight">Platform Control Centre</h1>

          <div className="flex items-center space-x-4">
            {/* Live Status Pill */}
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              <Zap size={12} className="text-emerald-500" />
              <span className="animate-pulse-dot inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Live</span>
            </div>

            {/* Date */}
            <div className="text-xs font-medium text-slate-400 hidden md:block">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
