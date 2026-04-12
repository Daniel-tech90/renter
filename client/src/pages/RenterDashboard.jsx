import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function RenterDashboard() {
  const [data, setData]         = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [downloading, setDownloading] = useState(null);
  const navigate = useNavigate();

  const renterInfo = JSON.parse(localStorage.getItem('renterInfo') || '{}');

  useEffect(() => {
    const token = localStorage.getItem('renterToken');
    if (!token) { navigate('/login'); return; }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    Promise.all([
      api.get('/renter/dashboard'),
      api.get('/renter/payments'),
    ]).then(([dashRes, payRes]) => {
      setData(dashRes.data);
      setPayments(payRes.data);
    }).catch(() => {
      toast.error('Session expired. Please login again.');
      handleLogout();
    }).finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('renterToken');
    localStorage.removeItem('renterInfo');
    delete api.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const downloadReceipt = async (id) => {
    setDownloading(id);
    try {
      const token = localStorage.getItem('renterToken');
      const baseURL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
      const res = await fetch(`${baseURL}/api/renter/payments/${id}/receipt`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed');
      }
      const blob = await res.blob();
      if (!blob || blob.size === 0) throw new Error('Empty receipt');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `receipt-${id}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Receipt downloaded!');
    } catch (err) {
      toast.error(err.message === 'Receipt only available for paid payments'
        ? 'Receipt not available for unpaid months'
        : 'Failed to download receipt');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-400">No data available. Please login again.</p>
    </div>
  );

  const { renter, summary } = data;

  const statCards = [
    {
      label: 'Monthly Rent',
      value: `₹${summary.totalRent.toLocaleString()}`,
      icon: '🏠',
      color: 'from-violet-500 to-indigo-600',
      shadow: 'shadow-violet-200',
    },
    {
      label: 'Electricity Bill',
      value: `₹${summary.electricityBill.toLocaleString()}`,
      icon: '⚡️',
      color: 'from-yellow-400 to-orange-500',
      shadow: 'shadow-yellow-200',
    },
    {
      label: 'Total Bill',
      value: `₹${summary.totalBill.toLocaleString()}`,
      icon: '🧾',
      color: 'from-rose-500 to-pink-600',
      shadow: 'shadow-rose-200',
      bold: true,
    },
    {
      label: 'Total Paid',
      value: `₹${summary.totalPaid.toLocaleString()}`,
      icon: '✅',
      color: 'from-emerald-400 to-teal-500',
      shadow: 'shadow-emerald-200',
    },
    {
      label: 'Total Due',
      value: `₹${summary.totalDue.toLocaleString()}`,
      icon: '⏳',
      color: 'from-amber-400 to-orange-500',
      shadow: 'shadow-amber-200',
    },
    {
      label: 'Paid Months',
      value: summary.paidMonths,
      icon: '📅',
      color: 'from-blue-400 to-cyan-500',
      shadow: 'shadow-blue-200',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 sm:px-6 py-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">🏠</div>
            <div className="min-w-0">
              <h1 className="font-bold text-base sm:text-lg truncate">Ramishwar Sahu Rental Portal</h1>
              <p className="text-emerald-100 text-xs">Renter Dashboard</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0"
          >
            🚪 <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">

        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-lg shadow-emerald-200 flex-shrink-0">
              {renter.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 truncate">{renter.name}</h2>
              <p className="text-slate-500 text-sm truncate">{renter.email || renter.phone}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 text-center flex-shrink-0">
              <div className="bg-violet-50 border border-violet-100 rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
                <p className="text-xs text-slate-400 font-medium">Room</p>
                <p className="font-bold text-violet-700 text-base sm:text-lg">#{renter.roomNumber}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
                <p className="text-xs text-slate-400 font-medium">Due</p>
                <p className="font-bold text-amber-700 text-base sm:text-lg">{renter.dueDate}th</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards — 2 cols mobile, 3 cols md, 6 cols lg (but max 2 rows of 3) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {statCards.map(({ label, value, icon, color, shadow, bold }) => (
            <div
              key={label}
              className={`bg-white rounded-2xl border ${bold ? 'border-rose-200 ring-2 ring-rose-100' : 'border-slate-100'} shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 p-4 flex flex-col gap-3`}
            >
              <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-lg shadow-md ${shadow}`}>
                {icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide leading-tight">{label}</p>
                <p className={`text-lg font-bold mt-0.5 ${bold ? 'text-rose-600' : 'text-slate-800'}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Due alert */}
        {summary.totalDue > 0 && (
          <div className="flex items-start sm:items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-4">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div>
              <p className="font-bold text-red-700">You have ₹{summary.totalDue.toLocaleString()} due</p>
              <p className="text-red-500 text-sm">Please clear your pending payments to avoid late fees.</p>
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Payment History</h3>
              <p className="text-xs text-slate-400 mt-0.5">{payments.length} total records</p>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {payments.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-slate-500 font-semibold">No payment records yet</p>
              </div>
            ) : payments.map((p) => (
              <div key={p._id} className={`rounded-2xl border p-4 space-y-3 ${
                p.status === 'Pending' ? 'bg-red-50/40 border-red-100' :
                p.status === 'Under Review' ? 'bg-blue-50/40 border-blue-100' :
                'bg-emerald-50/20 border-slate-100'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{p.month}</span>
                  {p.status === 'Paid' && <span className="badge-paid">✓ Paid</span>}
                  {p.status === 'Pending' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">⚠️ Due</span>}
                  {p.status === 'Under Review' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">📸 Review</span>}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white rounded-xl p-2 border border-slate-100">
                    <p className="text-slate-400">Rent</p>
                    <p className="font-bold text-slate-700">₹{p.amount.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-xl p-2 border border-slate-100">
                    <p className="text-slate-400">Electricity</p>
                    <p className="font-bold text-yellow-600">₹{(p.electricityBill || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-xl p-2 border border-rose-100">
                    <p className="text-slate-400">Total</p>
                    <p className="font-bold text-rose-600">₹{(p.totalAmount || p.amount).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                  {p.status === 'Paid' ? (
                    <button
                      onClick={() => downloadReceipt(p._id)}
                      disabled={downloading === p._id}
                      className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      {downloading === p._id ? '⏳ Loading...' : '🧾 Receipt'}
                    </button>
                  ) : <span>—</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-header text-left">Month</th>
                  <th className="table-header text-left">Rent</th>
                  <th className="table-header text-left">⚡ Electricity</th>
                  <th className="table-header text-left">Total</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-left">Paid On</th>
                  <th className="table-header text-left">Receipt</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="text-4xl mb-3">📋</div>
                      <p className="text-slate-500 font-semibold">No payment records yet</p>
                      <p className="text-slate-400 text-sm mt-1">Your payment history will appear here</p>
                    </td>
                  </tr>
                ) : payments.map((p) => (
                  <tr key={p._id} className={`border-b border-slate-50 transition-colors ${
                    p.status === 'Pending' ? 'bg-red-50/30 hover:bg-red-50/50' :
                    p.status === 'Under Review' ? 'bg-blue-50/20 hover:bg-blue-50/40' :
                    'hover:bg-emerald-50/30'
                  }`}>
                    <td className="table-cell font-semibold text-slate-800">{p.month}</td>
                    <td className="table-cell text-slate-700">₹{p.amount.toLocaleString()}</td>
                    <td className="table-cell font-semibold text-yellow-600">₹{(p.electricityBill || 0).toLocaleString()}</td>
                    <td className="table-cell font-bold text-rose-600">₹{(p.totalAmount || p.amount).toLocaleString()}</td>
                    <td className="table-cell">
                      {p.status === 'Paid' && <span className="badge-paid">✓ Paid</span>}
                      {p.status === 'Pending' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">⚠️ Due</span>}
                      {p.status === 'Under Review' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">📸 Review</span>}
                    </td>
                    <td className="table-cell text-slate-400 text-xs">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="table-cell">
                      {p.status === 'Paid' ? (
                        <button
                          onClick={() => downloadReceipt(p._id)}
                          disabled={downloading === p._id}
                          className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          {downloading === p._id ? '⏳ Loading...' : '🧾 Receipt'}
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
