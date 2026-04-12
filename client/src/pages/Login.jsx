import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const [tab, setTab] = useState('tenant'); // 'admin' | 'tenant'
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleTabSwitch = (t) => {
    setTab(t);
    setForm({ email: '', password: '' });
    setShowPass(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    delete api.defaults.headers.common['Authorization'];
    try {
      if (tab === 'admin') {
        const { data } = await api.post('/auth/login', form);
        login(data);
        navigate('/');
      } else {
        const { data } = await api.post('/auth/renter-login', form);
        localStorage.setItem('renterToken', data.token);
        localStorage.setItem('renterInfo', JSON.stringify(data.renter));
        toast.success(`Welcome, ${data.renter.name}! 🏠`);
        navigate('/renter/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = tab === 'admin';

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Video background */}
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
        <source src="/bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/60 z-0" />

      {/* Glowing orbs */}
      <div className={`absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full blur-3xl animate-pulse-slow z-0 transition-colors duration-500 ${isAdmin ? 'bg-violet-500/20' : 'bg-emerald-500/20'}`} />
      <div className={`absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] rounded-full blur-3xl animate-pulse-slow z-0 transition-colors duration-500 ${isAdmin ? 'bg-blue-500/20' : 'bg-teal-500/20'}`} style={{ animationDelay: '2s' }} />

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 z-10">
        <div className="text-center text-white">
          <div className="w-32 h-32 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/20 overflow-hidden">
            <img src="/photo.jpg" alt="Ramishwar Sahu" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-5xl font-bold mb-4 leading-tight drop-shadow-lg">
            <span className="font-extrabold bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent">Ramesh</span><br />
            <span className={`font-extrabold bg-gradient-to-r bg-clip-text text-transparent ${isAdmin ? 'from-violet-300 via-fuchsia-300 to-indigo-300' : 'from-emerald-300 via-cyan-300 to-teal-300'}`}>
              Rental Portal
            </span>
          </h1>
          <p className="text-white/70 text-lg mb-10 max-w-sm">
            {isAdmin
              ? 'Manage properties, track payments, and automate reminders.'
              : 'View your rent details, payment history and download receipts.'}
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
            {(isAdmin
              ? [['👥', 'Renters'], ['💰', 'Payments'], ['📊', 'Analytics']]
              : [['📋', 'History'], ['🧾', 'Receipts'], ['💰', 'Summary']]
            ).map(([icon, label]) => (
              <div key={label} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center hover:bg-white/20 transition-all duration-300 hover:-translate-y-1">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs text-white/60 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 z-10">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-2 overflow-hidden border-4 border-white/30 shadow-lg">
              <img src="/photo.jpg" alt="Ramishwar Sahu" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-xl font-bold text-white">Ramishwar Sahu Rental Portal</h1>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">

            {/* Tab Switcher */}
            <div className="flex bg-white/10 rounded-2xl p-1 mb-8 gap-1">
              <button
                onClick={() => handleTabSwitch('tenant')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${!isAdmin ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
              >
                🏠 Renter Login
              </button>
              <button
                onClick={() => handleTabSwitch('admin')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${isAdmin ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
              >
                🔐 Admin
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                {isAdmin ? 'Admin Login 🔐' : 'Renter Login 🏠'}
              </h2>
              <p className={`text-sm mt-1 ${isAdmin ? 'text-indigo-200' : 'text-emerald-200'}`}>
                {isAdmin ? 'Sign in to manage your rental properties' : 'Sign in to view your rent details'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isAdmin ? 'text-indigo-200' : 'text-emerald-200'}`}>Email Address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2">✉️</span>
                  <input
                    type="email"
                    className={`w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 transition-all ${isAdmin ? 'focus:ring-violet-400/50 focus:border-violet-400' : 'focus:ring-emerald-400/50 focus:border-emerald-400'}`}
                    placeholder={isAdmin ? 'admin@email.com' : 'your@email.com'}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isAdmin ? 'text-indigo-200' : 'text-emerald-200'}`}>Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2">🔒</span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className={`w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 pl-10 pr-12 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 transition-all ${isAdmin ? 'focus:ring-violet-400/50 focus:border-violet-400' : 'focus:ring-emerald-400/50 focus:border-emerald-400'}`}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-sm">
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed text-base mt-2 bg-gradient-to-r ${isAdmin ? 'from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 shadow-violet-500/30' : 'from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/30'}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Signing in...
                  </span>
                ) : '🚀 Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
