import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/renters', label: 'Renters', icon: '👥' },
  { to: '/payments', label: 'Payments', icon: '💰' },
  { to: '/annual-income', label: 'Income', icon: '💵' },
  { to: '/yearly-summary', label: 'Summary', icon: '📅' },
  { to: '/room-history', label: 'Rooms', icon: '🏠' },
  { to: '/history', label: 'History', icon: '🕓' },
];

// Shared nav content used in both desktop sidebar and mobile drawer
function SidebarContent({ expanded, admin, onLogout, onNavClick }) {
  const initials = admin?.email?.slice(0, 2).toUpperCase() || 'AD';
  return (
    <>
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none" />
      <div className="relative p-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg flex-shrink-0 border-2 border-blue-400/30">
            <img src="/photo.jpg" alt="logo" className="w-full h-full object-cover" />
          </div>
          {expanded && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight whitespace-nowrap">Ramesh</h1>
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
      <nav className="flex-1 px-2 py-3 space-y-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavClick}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 min-h-[48px] ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-400 hover:bg-white/10 hover:text-white'
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
      <div className="p-2 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-white hover:bg-red-500/10 rounded-2xl transition-all duration-200 group min-h-[48px]"
        >
          <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">🚪</span>
          {expanded && <span className="text-sm font-semibold whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </>
  );
}

export default function Sidebar({ onHoverChange, mobileOpen, onMobileClose }) {
  const { logout, admin } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); onMobileClose?.(); };
  const handleMouseEnter = () => { setExpanded(true); onHoverChange?.(true); };
  const handleMouseLeave = () => { setExpanded(false); onHoverChange?.(false); };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col shadow-2xl overflow-hidden z-50 transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-blue-400/30">
              <img src="/photo.jpg" alt="logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-sm font-bold">Ramesh</h1>
              <p className="text-slate-400 text-xs">Rental Portal</p>
            </div>
          </div>
          <button onClick={onMobileClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 text-white text-lg">×</button>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3.5 rounded-2xl transition-all duration-200 min-h-[52px] ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="text-xl flex-shrink-0">{icon}</span>
              <span className="text-sm font-semibold">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3.5 text-slate-400 hover:text-white hover:bg-red-500/10 rounded-2xl transition-all min-h-[52px]"
          >
            <span className="text-xl">🚪</span>
            <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ width: expanded ? '240px' : '68px', transition: 'width 0.3s ease' }}
        className="hidden lg:flex bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white flex-col min-h-screen shadow-2xl overflow-hidden flex-shrink-0 relative z-10"
      >
        <SidebarContent expanded={expanded} admin={admin} onLogout={handleLogout} />
      </aside>
    </>
  );
}
