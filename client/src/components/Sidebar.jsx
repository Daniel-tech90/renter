import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊', desc: 'Overview & stats' },
  { to: '/renters', label: 'Renters', icon: '👥', desc: 'Manage tenants' },
  { to: '/payments', label: 'Payments', icon: '💰', desc: 'Track payments' },
  { to: '/billing', label: 'Billing', icon: '🧾', desc: 'Bills & receipts' },
  { to: '/history', label: 'History', icon: '🕓', desc: 'Left renters & payments' },
];

export default function Sidebar({ onHoverChange }) {
  const { logout, admin } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = admin?.email?.slice(0, 2).toUpperCase() || 'AD';

  const handleMouseEnter = () => { setExpanded(true); onHoverChange?.(true); };
  const handleMouseLeave = () => { setExpanded(false); onHoverChange?.(false); };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ width: expanded ? '240px' : '68px', transition: 'width 0.3s ease' }}
      className="bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col min-h-screen shadow-2xl overflow-hidden flex-shrink-0 relative z-10"
    >
      {/* Decorative blob */}
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none" />

      {/* Logo / Profile */}
      <div className="relative p-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg flex-shrink-0 border-2 border-blue-400/30">
            <img src="/photo.jpg" alt="logo" className="w-full h-full object-cover" />
          </div>
          {expanded && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight whitespace-nowrap">Ramishwar Sahu</h1>
              <p className="text-slate-400 text-xs whitespace-nowrap">Rental Portal</p>
            </div>
          )}
        </div>

        {expanded && (
          <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-2.5 border border-white/10 mt-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-xs font-bold shadow-md flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">Administrator</p>
              <p className="text-xs text-slate-400 truncate">{admin?.email}</p>
            </div>
            <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-400 hover:bg-white/8 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-xl flex-shrink-0 transition-transform duration-200 ${!isActive ? 'group-hover:scale-110' : ''}`}>
                  {icon}
                </span>
                {expanded && (
                  <span className={`text-sm font-semibold whitespace-nowrap ${isActive ? 'text-white' : ''}`}>
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-white hover:bg-red-500/10 rounded-2xl transition-all duration-200 group"
        >
          <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">🚪</span>
          {expanded && <span className="text-sm font-semibold whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
