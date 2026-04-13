import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function RenterLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Clear any stale admin token before renter login
      delete api.defaults.headers.common['Authorization'];
      const { data } = await api.post('/auth/renter-login', form);
      localStorage.setItem('renterToken', data.token);
      localStorage.setItem('renterInfo', JSON.stringify(data.renter));
      toast.success(`Welcome, ${data.renter.name}! 🏠`);
      navigate('/renter/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Video background */}
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
        <source src="/bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/65 z-0" />
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-3xl animate-pulse-slow z-0" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-teal-500/20 rounded-full blur-3xl animate-pulse-slow z-0" />

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 z-10">
        <div className="text-center text-white">
          <div className="w-32 h-32 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/20 overflow-hidden">
            <img src="/photo.jpg" alt="Ramesh" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-5xl font-bold mb-4 leading-tight drop-shadow-lg">
            Tenant<br /><span className="text-emerald-300">Portal</span>
          </h1>
          <p className="text-emerald-100 text-lg mb-10 max-w-sm">View your rent details, payment history and download receipts.</p>
          <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
            {[['📋', 'History'], ['🧾', 'Receipts'], ['💰', 'Summary']].map(([icon, label]) => (
              <div key={label} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center hover:bg-white/20 transition-all duration-300 hover:-translate-y-1">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs text-emerald-200 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 z-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-20 h-20 rounded-2xl mx-auto mb-3 overflow-hidden border-4 border-white/30 shadow-lg">
              <img src="/photo.jpg" alt="Ramesh" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-white">Tenant Portal</h1>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">Tenant Login 🏠</h2>
              <p className="text-emerald-200 text-sm mt-1">Sign in to view your rent details</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-emerald-200 uppercase tracking-wide mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2">✉️</span>
                  <input type="email" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all"
                    placeholder="your@email.com" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-200 uppercase tracking-wide mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2">🔒</span>
                  <input type={showPass ? 'text' : 'password'}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 pl-10 pr-12 text-sm text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all"
                    placeholder="••••••••" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-white text-sm">
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 text-base mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Signing in...
                  </span>
                ) : '🚀 Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-xs text-emerald-300 hover:text-white transition-colors">
                Are you an admin? → Admin Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
