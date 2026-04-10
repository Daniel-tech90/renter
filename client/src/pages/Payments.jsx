import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { paymentService } from '../services';
import Modal from '../components/Modal';
import PaymentForm from '../components/PaymentForm';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', month: '' });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await paymentService.getAll(filters);
      setPayments(data);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const openAdd = () => { setEditing(null); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); };
  const onSuccess = () => { closeModal(); fetchPayments(); };
  const downloadReceipt = (id) => window.open(paymentService.getReceiptUrl(id), '_blank');

  const paidCount = payments.filter(p => p.status === 'Paid').length;
  const pendingCount = payments.filter(p => p.status === 'Pending').length;
  const totalAmount = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Records', value: payments.length, icon: '📋', color: 'bg-slate-50 border-slate-200 text-slate-700' },
          { label: 'Paid', value: paidCount, icon: '✅', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          { label: 'Pending', value: pendingCount, icon: '⏳', color: 'bg-amber-50 border-amber-200 text-amber-700' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${color} font-semibold`}>
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="text-xs opacity-70 font-medium">{label}</p>
              <p className="text-xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div className="card">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <select
              className="input max-w-[160px]"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="Paid">✅ Paid</option>
              <option value="Pending">⏳ Pending</option>
            </select>
            <input
              type="month"
              className="input max-w-[190px]"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            />
            {(filters.status || filters.month) && (
              <button className="btn-secondary text-sm" onClick={() => setFilters({ status: '', month: '' })}>
                ✕ Clear Filters
              </button>
            )}
          </div>
          <button className="btn-primary whitespace-nowrap" onClick={openAdd}>
            ＋ Record Payment
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-header text-left">Tenant</th>
                <th className="table-header text-left">Room</th>
                <th className="table-header text-left">Month</th>
                <th className="table-header text-left">Amount</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left">Paid On</th>
                <th className="table-header text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Loading payments...</p>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="text-4xl mb-3">💳</div>
                    <p className="text-slate-500 font-semibold">No payments found</p>
                    <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or record a new payment</p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-xl flex items-center justify-center text-xs font-bold text-violet-600 flex-shrink-0">
                          {p.renterId?.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{p.renterId?.name}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="bg-violet-50 text-violet-700 border border-violet-100 px-2.5 py-1 rounded-lg text-xs font-bold">
                        Room {p.renterId?.roomNumber}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="font-medium text-slate-600">{p.month}</span>
                    </td>
                    <td className="table-cell">
                      <span className="font-bold text-slate-800">₹{p.amount.toLocaleString()}</span>
                    </td>
                    <td className="table-cell">
                      <span className={p.status === 'Paid' ? 'badge-paid' : 'badge-pending'}>
                        {p.status === 'Paid' ? '✓' : '⏳'} {p.status}
                      </span>
                    </td>
                    <td className="table-cell text-slate-400 text-xs">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)} className="btn-ghost bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                          ✏️ Edit
                        </button>
                        {p.status === 'Paid' && (
                          <button onClick={() => downloadReceipt(p._id)} className="btn-ghost bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                            🧾 Receipt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        {payments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
            <p className="text-slate-400">{payments.length} records shown</p>
            <p className="font-semibold text-slate-700">
              Total Collected: <span className="text-emerald-600">₹{totalAmount.toLocaleString()}</span>
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? '✏️ Edit Payment' : '💰 Record Payment'} onClose={closeModal}>
          <PaymentForm payment={editing} onSuccess={onSuccess} onClose={closeModal} />
        </Modal>
      )}
    </div>
  );
}
