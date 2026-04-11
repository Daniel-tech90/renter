import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊', desc: 'Overview & stats' },
  { to: '/renters', label: 'Renters', icon: '👥', desc: 'Manage tenants' },
  { to: '/payments', label: 'Payments', icon: '💰', desc: 'Track payments' },
  { to: '/billing', label: 'Billing', icon: '🧾', desc: 'Bills & receipts' },
  { to: '/history', label: 'History', icon: '🕓', desc: 'Left renters & payments' },
];

export default function Sidebar() {
  const { logout, admin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = admin?.email?.slice(0, 2).toUpperCase() || 'AD';

  return (
    <aside className="w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white flex flex-col min-h-screen shadow-2xl shadow-slate-900/50 relative">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-br from-violet-600/20 to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="relative p-6 pb-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg flex-shrink-0 border-2 border-violet-400/30">
            <img src="/photo.jpg" alt="Ramishwar Sahu" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Ramishwar Sahu</h1>
            <p className="text-slate-400 text-xs">Rental Portal</p>
          </div>
        </div>

        {/* Admin profile */}
        <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-3 border border-white/10">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-xl flex items-center justify-center text-sm font-bold shadow-md flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">Administrator</p>
            <p className="text-xs text-slate-400 truncate">{admin?.email}</p>
          </div>
          <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0 shadow-sm shadow-emerald-400/50" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1 relative">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-3 mb-3">Navigation</p>
        {links.map(({ to, label, icon, desc }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-xl transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}>
                  {icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isActive ? 'text-white' : ''}`}>{label}</p>
                  <p className={`text-xs truncate ${isActive ? 'text-violet-200' : 'text-slate-500'}`}>{desc}</p>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-red-500/10 rounded-2xl transition-all duration-200 group"
        >
          <span className="text-xl group-hover:scale-110 transition-transform duration-200">🚪</span>
          <div className="text-left">
            <p className="text-sm font-semibold">Logout</p>
            <p className="text-xs text-slate-500">End your session</p>
          </div>
        </button>
      </div>
    </aside>
  );
}
