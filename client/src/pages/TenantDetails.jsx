import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function TenantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/history/tenant/${id}`)
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load tenant details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  const { renter: r, payments } = data;
  const totalPaid = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (p.totalAmount || p.amount), 0);
  const totalDue = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + (p.totalAmount || p.amount), 0);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <button onClick={() => navigate('/history')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors">
        ← Back to History
      </button>

      {/* Tenant Info */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg">
            {r.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{r.name}</h2>
            <p className="text-slate-400 text-sm">{r.isActive ? '🟢 Active' : '🔴 Vacated'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Phone', value: `📞 ${r.phone}` },
            { label: 'Room', value: `🏠 Room ${r.roomNumber}` },
            { label: 'Rent', value: `₹${r.rentAmount?.toLocaleString()}/mo` },
            { label: 'Join Date', value: new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
            { label: 'Left Date', value: r.leftAt ? new Date(r.leftAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-2xl p-4">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
              <p className="font-bold text-slate-700">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card bg-emerald-50 border border-emerald-100">
          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-emerald-700">₹{totalPaid.toLocaleString()}</p>
        </div>
        <div className="card bg-red-50 border border-red-100">
          <p className="text-xs text-red-500 font-semibold uppercase tracking-wide mb-1">Remaining Due</p>
          <p className="text-2xl font-bold text-red-600">₹{totalDue.toLocaleString()}</p>
        </div>
      </div>

      {/* Payment History */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-800">Payment History</h3>
          <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-3 py-1.5 rounded-xl">{payments.length} records</span>
        </div>

        {payments.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-400">No payment records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-header text-left">Month</th>
                  <th className="table-header text-left">Rent</th>
                  <th className="table-header text-left">Units</th>
                  <th className="table-header text-left">Elec. Bill</th>
                  <th className="table-header text-left">Total</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-left">Paid On</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {payments.map((p) => (
                  <tr key={p._id} className="border-b border-slate-50">
                    <td className="table-cell font-semibold text-slate-700">{p.month}</td>
                    <td className="table-cell text-slate-700">₹{p.amount.toLocaleString()}</td>
                    <td className="table-cell text-slate-500">{p.unitsConsumed || 0} u</td>
                    <td className="table-cell text-slate-600">₹{(p.electricityBill || 0).toLocaleString()}</td>
                    <td className="table-cell font-bold text-indigo-700">₹{(p.totalAmount || p.amount).toLocaleString()}</td>
                    <td className="table-cell">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                        p.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        p.status === 'Under Review' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                        'bg-red-50 text-red-500 border border-red-100'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="table-cell text-slate-400 text-xs">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
