import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authService.login(form);
      login(data);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-800 relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Decorative circles */}
        <div className="absolute top-[-80px] left-[-80px] w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/3 rounded-full" />

        <div className="relative z-10 text-center text-white">
          <div className="w-24 h-24 rounded-3xl mx-auto mb-8 shadow-2xl border-4 border-white/30 overflow-hidden">
            <img src="/photo.jpg" alt="Ramishwar Sahu" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">Ramishwar Sahu<br />Rental Portal</h1>
          <p className="text-indigo-200 text-lg mb-10 max-w-sm">Manage your properties, track payments, and automate reminders — all in one place.</p>
          <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
            {[['👥', 'Renters'], ['💰', 'Payments'], ['📊', 'Analytics']].map(([icon, label]) => (
              <div key={label} className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/15 text-center">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs text-indigo-200 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-20 h-20 rounded-2xl mx-auto mb-3 overflow-hidden border-4 border-indigo-100 shadow-lg">
              <img src="/photo.jpg" alt="Ramishwar Sahu" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Ramishwar Sahu Rental Portal</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-100 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
              <p className="text-slate-400 text-sm mt-1">Sign in to your admin account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="input-label">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">✉️</span>
                  <input
                    type="email"
                    className="input pl-10"
                    placeholder="admin@rentportal.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">🔒</span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input pl-10 pr-12"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-3 text-base mt-2" disabled={loading}>
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

            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400 font-medium mb-2">Your Credentials</p>
              <p className="text-xs text-slate-600">📧 ramishwarsahu9@gmail.com</p>
              <p className="text-xs text-slate-600">🔑 extramark12</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
