import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const AVATAR_SRC = '/src/assets/images/physician_profile_avatar_1795598548632.jpg';

interface LayoutProps {
  children: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function Layout({ children, primaryAction }: LayoutProps) {
  const { state, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const pageTitle = (() => {
    if (location.pathname.startsWith('/patients')) return 'Patient Management';
    if (location.pathname.startsWith('/billing')) return 'Billing & Payments';
    return 'Clinical Dashboard';
  })();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/patients', label: 'Patients', icon: Users },
    { to: '/billing', label: 'Billing', icon: CreditCard },
  ];

  const userInitials = (state.auth.user?.name || 'DR')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 no-print">
        <div className="h-16 px-6 flex items-center border-b border-slate-200">
          <NavLink
            to="/dashboard"
            className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
          >
            CareLedger
          </NavLink>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-teal-50 text-teal-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-3">
            {!avatarFailed ? (
              <img
                src={AVATAR_SRC}
                alt={state.auth.user?.name || 'Clinic User'}
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-teal-700 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                {userInitials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {state.auth.user?.name || 'Clinic Staff'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {state.auth.user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-full bg-white h-full border-r border-slate-200 flex flex-col">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200">
              <span className="text-lg font-bold text-slate-900 font-display">
                CareLedger
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-teal-50 text-teal-800'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-60 flex flex-col min-w-0">
        {/* Top Bar Contract: 3 clean zones separated by gap-8 */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-8 sticky top-0 z-30 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate font-display">
              {pageTitle}
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors ${
                  isActive ? 'text-teal-700 underline underline-offset-4' : ''
                }`
              }
            >
              Overview
            </NavLink>
            <NavLink
              to="/patients"
              className={({ isActive }) =>
                `whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors ${
                  isActive ? 'text-teal-700 underline underline-offset-4' : ''
                }`
              }
            >
              Patient Registry
            </NavLink>
            <NavLink
              to="/billing"
              className={({ isActive }) =>
                `whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors ${
                  isActive ? 'text-teal-700 underline underline-offset-4' : ''
                }`
              }
            >
              Billing Ledger
            </NavLink>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {primaryAction ? (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {primaryAction.label}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Sign out
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
