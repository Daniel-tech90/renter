import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const titles = {
  '/': { title: 'Dashboard', subtitle: 'Overview of your rental properties' },
  '/renters': { title: 'Renters', subtitle: 'Manage all your tenants' },
  '/payments': { title: 'Payments', subtitle: 'Track and record rent payments' },
};

export default function Layout() {
  const { pathname } = useLocation();
  const { title, subtitle } = titles[pathname] || { title: 'Portal', subtitle: '' };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
