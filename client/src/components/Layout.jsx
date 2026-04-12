import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const titles = {
  '/': { title: 'Dashboard', subtitle: 'Overview of your rental properties' },
  '/renters': { title: 'Renters', subtitle: 'Manage all your tenants' },
  '/payments': { title: 'Payments', subtitle: 'Track and record rent payments' },
  '/yearly-summary': { title: 'Yearly Summary', subtitle: 'Annual income overview' },
  '/history': { title: 'History', subtitle: 'Past renters and payments' },
};

export default function Layout() {
  const { pathname } = useLocation();
  const { title, subtitle } = titles[pathname] || { title: 'Portal', subtitle: '' };
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        onHoverChange={setSidebarExpanded}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between shadow-sm gap-3">
          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex-shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect y="3" width="20" height="2" rx="1" />
              <rect y="9" width="20" height="2" rx="1" />
              <rect y="15" width="20" height="2" rx="1" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-xl font-bold text-slate-800 truncate">{title}</h2>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2 sm:px-3 py-1.5 rounded-xl hidden sm:block">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-xl sm:hidden">
              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
