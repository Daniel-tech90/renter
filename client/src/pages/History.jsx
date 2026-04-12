import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function History() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('left');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/history')
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm font-medium">Loading history...</p>
      </div>
    </div>
  );

  const { leftRenters, paidPayments } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl flex items-center justify-center text-xl shadow-lg">
          🕓
        </div>
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Records</p>
          <p className="text-2xl font-bold text-slate-800">History</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 rounded-2xl p-1 gap-1 max-w-sm">
        <button
          onClick={() => setTab('left')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${tab === 'left' ? 'bg-white text-slate-800 shadow' : 'text-slate-400 hover:text-slate-600'}`}
        >
          🚪 Left Renters ({leftRenters.length})
        </button>
        <button
          onClick={() => setTab('paid')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${tab === 'paid' ? 'bg-white text-slate-800 shadow' : 'text-slate-400 hover:text-slate-600'}`}
        >
          ✅ Paid History ({paidPayments.length})
        </button>
      </div>

      {/* Left Renters Tab */}
      {tab === 'left' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800">Vacated Tenants</h3>
              <p className="text-xs text-slate-400 mt-0.5">Renters who have left the property</p>
            </div>
            <span className="text-xs bg-red-50 text-red-500 font-semibold px-3 py-1.5 rounded-xl border border-red-100">
              {leftRenters.length} records
            </span>
          </div>

          {leftRenters.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">🏠</div>
              <p className="text-slate-500 font-semibold">No vacated tenants yet</p>
              <p className="text-slate-400 text-sm mt-1">Removed renters will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="table-header text-left">Tenant</th>
                    <th className="table-header text-left">Phone</th>
                    <th className="table-header text-left">Room</th>
                    <th className="table-header text-left">Rent</th>
                    <th className="table-header text-left">Joined</th>
                    <th className="table-header text-left">Left On</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {leftRenters.map((r) => (
                    <tr key={r._id} onClick={() => navigate(`/tenant/${r._id}`)} className="border-b border-slate-50 hover:bg-red-50/30 transition-colors cursor-pointer">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-sm font-bold text-slate-500 flex-shrink-0">
                            {r.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-700">{r.name}</span>
                        </div>
                      </td>
                      <td className="table-cell text-slate-500">📞 {r.phone}</td>
                      <td className="table-cell">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-xl text-xs font-bold">
                          Room {r.roomNumber}
                        </span>
                      </td>
                      <td className="table-cell font-semibold text-slate-700">₹{r.rentAmount.toLocaleString()}<span className="text-slate-400 text-xs">/mo</span></td>
                      <td className="table-cell text-slate-400 text-xs">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="table-cell">
                        {r.leftAt ? (
                          <span className="bg-red-50 text-red-500 border border-red-100 px-2.5 py-1 rounded-xl text-xs font-semibold">
                            {new Date(r.leftAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Paid Payments Tab */}
      {tab === 'paid' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800">Payment History</h3>
              <p className="text-xs text-slate-400 mt-0.5">All confirmed paid payments</p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-3 py-1.5 rounded-xl border border-emerald-100">
              {paidPayments.length} records
            </span>
          </div>

          {paidPayments.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">💰</div>
              <p className="text-slate-500 font-semibold">No paid payments yet</p>
              <p className="text-slate-400 text-sm mt-1">Confirmed payments will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="table-header text-left">Tenant</th>
                    <th className="table-header text-left">Room</th>
                    <th className="table-header text-left">Month</th>
                    <th className="table-header text-left">Amount</th>
                    <th className="table-header text-left">Paid On</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {paidPayments.map((p) => (
                    <tr key={p._id} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-sm font-bold text-emerald-600 flex-shrink-0">
                            {p.renterId?.name?.slice(0, 2).toUpperCase() || '??'}
                          </div>
                          <span className="font-semibold text-slate-800">{p.renterId?.name || '—'}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="bg-violet-50 text-violet-700 border border-violet-100 px-2.5 py-1 rounded-xl text-xs font-bold">
                          Room {p.renterId?.roomNumber || '—'}
                        </span>
                      </td>
                      <td className="table-cell font-semibold text-slate-700">{p.month}</td>
                      <td className="table-cell font-bold text-emerald-600">₹{p.amount.toLocaleString()}</td>
                      <td className="table-cell text-slate-400 text-xs">
                        {p.paymentDate
                          ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
