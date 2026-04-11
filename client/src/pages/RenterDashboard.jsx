import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function RenterDashboard() {
  const [data, setData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const navigate = useNavigate();

  const renterInfo = JSON.parse(localStorage.getItem('renterInfo') || '{}');

  useEffect(() => {
    const token = localStorage.getItem('renterToken');
    if (!token) { navigate('/renter-login'); return; }
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
    navigate('/renter-login');
  };

  const downloadReceipt = async (id) => {
    setDownloading(id);
    try {
      const token = localStorage.getItem('renterToken');
      const res = await fetch(`/api/renter/payments/${id}/receipt`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `receipt-${id}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download receipt');
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

  const { renter, summary } = data;

  const statCards = [
    { label: 'Monthly Rent', value: `₹${summary.totalRent.toLocaleString()}`, icon: '🏠', color: 'from-violet-500 to-indigo-600', shadow: 'shadow-violet-200' },
    { label: 'Total Paid', value: `₹${summary.totalPaid.toLocaleString()}`, icon: '✅', color: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-200' },
    { label: 'Total Due', value: `₹${summary.totalDue.toLocaleString()}`, icon: '⏳', color: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-200' },
    { label: 'Paid Months', value: summary.paidMonths, icon: '📅', color: 'from-blue-400 to-cyan-500', shadow: 'shadow-blue-200' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-xl">🏠</div>
            <div>
              <h1 className="font-bold text-lg">Ramishwar Sahu Rental Portal</h1>
              <p className="text-emerald-100 text-xs">Tenant Dashboard</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-medium transition-all">
            🚪 Logout
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-emerald-200 flex-shrink-0">
              {renter.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-800">{renter.name}</h2>
              <p className="text-slate-500 text-sm">{renter.email || renter.phone}</p>
            </div>
            <div className="hidden sm:grid grid-cols-2 gap-3 text-center">
              <div className="bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3">
                <p className="text-xs text-slate-400 font-medium">Room</p>
                <p className="font-bold text-violet-700 text-lg">#{renter.roomNumber}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                <p className="text-xs text-slate-400 font-medium">Due Date</p>
                <p className="font-bold text-amber-700 text-lg">{renter.dueDate}th</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon, color, shadow }) => (
            <div key={label} className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 p-5 flex items-center gap-4`}>
              <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center text-xl shadow-lg ${shadow} flex-shrink-0`}>
                {icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Payment History</h3>
              <p className="text-xs text-slate-400 mt-0.5">{payments.length} total records</p>
            </div>
            {summary.totalDue > 0 && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-xl">
                ⚠️ ₹{summary.totalDue.toLocaleString()} Due
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-header text-left">Month</th>
                  <th className="table-header text-left">Amount</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-left">Paid On</th>
                  <th className="table-header text-left">Receipt</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="text-4xl mb-3">📋</div>
                      <p className="text-slate-500 font-semibold">No payment records yet</p>
                      <p className="text-slate-400 text-sm mt-1">Your payment history will appear here</p>
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p._id} className={`border-b border-slate-50 transition-colors ${p.status === 'Pending' ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-emerald-50/30'}`}>
                      <td className="table-cell font-semibold text-slate-800">{p.month}</td>
                      <td className="table-cell font-bold text-slate-800">₹{p.amount.toLocaleString()}</td>
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
                            {downloading === p._id ? '⏳' : '🧾'} Receipt
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
