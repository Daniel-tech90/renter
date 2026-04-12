import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { paymentService } from '../services';
import Modal from '../components/Modal';

function TenantHistoryModal({ renterId, renterName, onClose }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentService.getByRenter(renterId)
      .then(({ data }) => setPayments(data))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, [renterId]);

  const totalPaid = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + (p.totalAmount || p.amount), 0);
  const totalDue = payments.filter(p => p.status === 'Pending').reduce((s, p) => s + (p.totalAmount || p.amount), 0);

  return (
    <Modal title={`📋 ${renterName} — Payment History`} onClose={onClose}>
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
              <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Total Paid</p>
              <p className="text-xl font-bold text-emerald-700">₹{totalPaid.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              <p className="text-xs text-red-500 font-semibold uppercase tracking-wide">Total Due</p>
              <p className="text-xl font-bold text-red-600">₹{totalDue.toLocaleString('en-IN')}</p>
            </div>
          </div>
          {payments.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No payment records found</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
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
                    <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="table-cell font-semibold text-slate-700">{p.month}</td>
                      <td className="table-cell text-slate-700">₹{p.amount.toLocaleString('en-IN')}</td>
                      <td className="table-cell text-slate-500">{p.unitsConsumed || 0} u</td>
                      <td className="table-cell text-slate-600">₹{(p.electricityBill || 0).toLocaleString('en-IN')}</td>
                      <td className="table-cell font-bold text-indigo-700">₹{(p.totalAmount || p.amount).toLocaleString('en-IN')}</td>
                      <td className="table-cell">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                          p.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          p.status === 'Under Review' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                          'bg-red-50 text-red-500 border border-red-100'
                        }`}>{p.status}</span>
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
      )}
    </Modal>
  );
}

export default function History() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tenantHistory, setTenantHistory] = useState(null);

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

  const { paidPayments } = data;

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

      {/* Paid Payments */}
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
                        <button
                          onClick={() => setTenantHistory({ renterId: p.renterId?._id, renterName: p.renterId?.name })}
                          className="font-semibold text-slate-800 hover:text-violet-600 hover:underline transition-colors text-left"
                        >
                          {p.renterId?.name || '—'}
                        </button>
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
      {tenantHistory && (
        <TenantHistoryModal
          renterId={tenantHistory.renterId}
          renterName={tenantHistory.renterName}
          onClose={() => setTenantHistory(null)}
        />
      )}
    </div>
  );
}
