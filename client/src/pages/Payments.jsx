import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { paymentService } from '../services';
import Modal from '../components/Modal';
import PaymentForm from '../components/PaymentForm';
import api from '../services/api';

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
  const totalDue  = payments.filter(p => p.status === 'Pending').reduce((s, p) => s + (p.totalAmount || p.amount), 0);

  return (
    <Modal title={`📋 ${renterName} — Payment History`} onClose={onClose}>
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-2xl px-4 py-3">
              <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Total Paid</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">₹{totalPaid.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-2xl px-4 py-3">
              <p className="text-xs text-red-500 font-semibold uppercase tracking-wide">Total Due</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">₹{totalDue.toLocaleString('en-IN')}</p>
            </div>
          </div>
          {payments.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No payment records found</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                  <tr>
                    {['Month','Rent','Units','Elec.','Total','Status','Paid On'].map(h => (
                      <th key={h} className="table-header text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900">
                  {payments.map((p) => (
                    <tr key={p._id} className={`border-b border-slate-50 dark:border-slate-800 ${p.status === 'Room Closed' ? 'opacity-50' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}`}>
                      <td className="table-cell font-semibold">{p.month}</td>
                      <td className="table-cell">{p.status === 'Room Closed' ? '—' : `₹${p.amount.toLocaleString('en-IN')}`}</td>
                      <td className="table-cell">{p.status === 'Room Closed' ? '—' : `${p.unitsConsumed || 0}u`}</td>
                      <td className="table-cell">{p.status === 'Room Closed' ? '—' : `₹${(p.electricityBill || 0).toLocaleString('en-IN')}`}</td>
                      <td className="table-cell font-bold text-indigo-600">{p.status === 'Room Closed' ? '—' : `₹${(p.totalAmount || p.amount).toLocaleString('en-IN')}`}</td>
                      <td className="table-cell">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                          p.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          p.status === 'Room Closed' ? 'bg-slate-100 text-slate-400 border border-slate-200' :
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

export default function Payments() {
  const [payments, setPayments]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filters, setFilters]           = useState({ status: '', month: '' });
  const [showModal, setShowModal]       = useState(false);
  const [editing, setEditing]           = useState(null);
  const [sending, setSending]           = useState(null);
  const [generatingBill, setGeneratingBill] = useState(null);
  const [tenantHistory, setTenantHistory]   = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await paymentService.getAll(filters);
      setPayments(data);
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const openAdd   = () => { setEditing(null); setShowModal(true); };
  const openEdit  = (p) => { setEditing(p); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); };
  const onSuccess  = () => { closeModal(); fetchPayments(); };

  const downloadBill = async (id) => {
    setGeneratingBill(id);
    try {
      const token = localStorage.getItem('token');
      const base  = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
      const res   = await fetch(`${base}/api/payments/${id}/bill`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: `bill-${id}.pdf` }).click();
      window.URL.revokeObjectURL(url);
      toast.success('Bill downloaded!');
    } catch { toast.error('Failed to generate bill'); }
    finally { setGeneratingBill(null); }
  };

  const downloadReceipt = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const base  = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
      const res   = await fetch(`${base}/api/payments/${id}/receipt`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: `receipt-${id}.pdf` }).click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download receipt'); }
  };

  const handleApprove = async (id) => {
    try { await paymentService.approve(id); toast.success('Approved! ✅'); fetchPayments(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this payment?')) return;
    try { await paymentService.reject(id); toast.success('Rejected.'); fetchPayments(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleSendMessage = async (id, type) => {
    setSending(id + type);
    try {
      await paymentService.sendMessage(id, type);
      toast.success(type === 'reminder' ? '⏰ Reminder sent!' : '✅ Confirmation sent!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSending(null); }
  };

  const paidCount    = payments.filter(p => p.status === 'Paid').length;
  const pendingCount = payments.filter(p => p.status === 'Pending').length;
  const reviewCount  = payments.filter(p => p.status === 'Under Review').length;
  const totalCollected = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + (p.totalAmount || p.amount), 0);
  const collectionRate = payments.length ? Math.round((paidCount / payments.length) * 100) : 0;

  const displayPayments = filters.month
    ? payments
    : Object.values(
        payments.reduce((acc, p) => {
          const id = p.renterId?._id;
          if (!id) return acc;
          if (!acc[id] || p.month > acc[id].month) acc[id] = p;
          return acc;
        }, {})
      ).sort((a, b) => (a.renterId?.name || '').localeCompare(b.renterId?.name || ''));

  const statusBadge = (status) => {
    const map = {
      'Paid':         'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400',
      'Partial':      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400',
      'Under Review': 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400',
      'Pending':      'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/40 dark:text-red-400',
    };
    const icons = { 'Paid': '✓', 'Partial': '💳', 'Under Review': '🔍', 'Pending': '⏳' };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${map[status] || map['Pending']}`}>
        {icons[status] || '⏳'} {status}
      </span>
    );
  };

  const ActionButtons = ({ p }) => (
    <div className="flex items-center gap-1.5 flex-wrap">
      {p.status === 'Under Review' && (
        <>
          <button onClick={() => handleApprove(p._id)} title="Approve" className="btn-ghost bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-100 text-xs px-2.5 py-1.5">✅ Approve</button>
          <button onClick={() => handleReject(p._id)} title="Reject" className="btn-ghost bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 text-xs px-2.5 py-1.5">❌ Reject</button>
        </>
      )}
      {p.status !== 'Under Review' && (
        <button onClick={() => openEdit(p)} title="Edit" className="btn-ghost bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs px-2.5 py-1.5">✏️ Edit</button>
      )}
      {p.status === 'Paid' && (
        <>
          <button onClick={() => handleSendMessage(p._id, 'confirmation')} disabled={sending === p._id + 'confirmation'} title="Send confirmation" className="btn-ghost bg-green-50 dark:bg-green-900/30 text-green-600 hover:bg-green-100 disabled:opacity-50 text-xs px-2.5 py-1.5">
            {sending === p._id + 'confirmation' ? '⏳' : '📱'}
          </button>
          <button onClick={() => downloadReceipt(p._id)} title="Download receipt" className="btn-ghost bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-100 text-xs px-2.5 py-1.5">🧾</button>
        </>
      )}
      {p.status === 'Pending' && (
        <button onClick={() => handleSendMessage(p._id, 'reminder')} disabled={sending === p._id + 'reminder'} title="Send reminder" className="btn-ghost bg-amber-50 dark:bg-amber-900/30 text-amber-600 hover:bg-amber-100 disabled:opacity-50 text-xs px-2.5 py-1.5">
          {sending === p._id + 'reminder' ? '⏳' : '⏰'} Remind
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Hero Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected — gradient card */}
        <div className="col-span-2 lg:col-span-1 relative overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full" />
          <p className="text-xs font-semibold opacity-80 uppercase tracking-widest mb-1">Total Collected</p>
          <p className="text-3xl font-bold">₹{totalCollected.toLocaleString('en-IN')}</p>
          <p className="text-xs opacity-70 mt-1">{paidCount} payments received</p>
        </div>

        {[
          { label: 'Paid', value: paidCount, sub: `${collectionRate}% rate`, icon: '✅', bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
          { label: 'Under Review', value: reviewCount, sub: 'Needs approval', icon: '🔍', bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
          { label: 'Pending', value: pendingCount, sub: 'Awaiting payment', icon: '⏳', bg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
        ].map(({ label, value, sub, icon, bg, border, text, dot }) => (
          <div key={label} className={`relative overflow-hidden bg-gradient-to-br ${bg} border ${border} rounded-2xl p-5 shadow-sm`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-xl`}>{icon}</div>
              <div className={`w-2 h-2 rounded-full ${dot} mt-1`} />
            </div>
            <p className={`text-2xl font-bold ${text}`}>{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Collection Rate Bar ── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Collection Rate</span>
          <span className="text-sm font-bold text-violet-600">{collectionRate}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
            style={{ width: `${collectionRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
          <span>{paidCount} paid</span>
          <span>{pendingCount} pending</span>
          <span>{payments.length} total</span>
        </div>
      </div>

      {/* ── Under Review Alert ── */}
      {reviewCount > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl px-5 py-4 shadow-sm">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🔍</div>
          <div className="flex-1">
            <p className="font-bold text-blue-800 dark:text-blue-300">{reviewCount} payment{reviewCount > 1 ? 's' : ''} waiting for approval</p>
            <p className="text-blue-600 dark:text-blue-400 text-xs mt-0.5">Review and approve or reject below</p>
          </div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0" />
        </div>
      )}

      {/* ── Main Table Card ── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select
              className="input flex-1 sm:flex-none sm:w-44 text-sm"
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="Paid">✅ Paid</option>
              <option value="Pending">⏳ Pending</option>
              <option value="Under Review">🔍 Under Review</option>
            </select>
            <input
              type="month"
              className="input flex-1 sm:flex-none sm:w-44 text-sm"
              value={filters.month}
              onChange={e => setFilters({ ...filters, month: e.target.value })}
            />
            {(filters.status || filters.month) && (
              <button className="btn-secondary text-sm px-3" onClick={() => setFilters({ status: '', month: '' })}>✕ Clear</button>
            )}
          </div>
          <button className="btn-primary w-full sm:w-auto" onClick={openAdd}>＋ Record Payment</button>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
              <tr>
                {['Tenant','Room','Month','Rent','Electricity','Total','Status','Bill','Actions'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {loading ? (
                <tr><td colSpan={9} className="py-20 text-center">
                  <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Loading payments...</p>
                </td></tr>
              ) : displayPayments.length === 0 ? (
                <tr><td colSpan={9} className="py-20 text-center">
                  <div className="text-5xl mb-3">💳</div>
                  <p className="text-slate-500 font-semibold">No payments found</p>
                  <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
                </td></tr>
              ) : displayPayments.map((p, idx) => (
                <tr key={p._id} className={`group transition-colors duration-150 ${
                  idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'
                } hover:bg-violet-50/40 dark:hover:bg-violet-900/10 ${
                  p.status === 'Under Review' ? '!bg-blue-50/40 dark:!bg-blue-900/10' : ''
                }`}>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
                        {p.renterId?.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <button
                        onClick={() => setTenantHistory({ renterId: p.renterId?._id, renterName: p.renterId?.name })}
                        className="font-semibold text-slate-800 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-left text-sm"
                      >
                        {p.renterId?.name}
                      </button>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-800 px-2.5 py-1 rounded-lg text-xs font-bold">
                      #{p.renterId?.roomNumber}
                    </span>
                  </td>
                  <td className="table-cell text-sm font-medium text-slate-600 dark:text-slate-400">{p.month}</td>
                  <td className="table-cell text-sm font-semibold text-slate-700 dark:text-slate-300">₹{p.amount.toLocaleString()}</td>
                  <td className="table-cell text-sm text-slate-500 dark:text-slate-400">₹{(p.electricityBill || 0).toLocaleString()}</td>
                  <td className="table-cell">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">₹{(p.totalAmount || p.amount).toLocaleString()}</span>
                  </td>
                  <td className="table-cell">{statusBadge(p.status)}</td>
                  <td className="table-cell">
                    <button
                      onClick={() => downloadBill(p._id)}
                      disabled={generatingBill === p._id}
                      title="Generate Bill PDF"
                      className="btn-ghost bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 disabled:opacity-50 text-xs px-3 py-1.5"
                    >
                      {generatingBill === p._id ? '⏳' : '🧾'} {generatingBill === p._id ? '...' : 'Bill'}
                    </button>
                  </td>
                  <td className="table-cell"><ActionButtons p={p} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-700">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Loading...</p>
            </div>
          ) : displayPayments.map((p) => (
            <div key={p._id} className="p-4 space-y-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {p.renterId?.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <button onClick={() => setTenantHistory({ renterId: p.renterId?._id, renterName: p.renterId?.name })} className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      {p.renterId?.name}
                    </button>
                    <p className="text-xs text-slate-400">Room {p.renterId?.roomNumber} · {p.month}</p>
                  </div>
                </div>
                {statusBadge(p.status)}
              </div>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
                <div className="text-xs text-slate-500">Total</div>
                <div className="font-bold text-indigo-600 dark:text-indigo-400">₹{(p.totalAmount || p.amount).toLocaleString()}</div>
              </div>
              <ActionButtons p={p} />
            </div>
          ))}
        </div>

        {/* Footer */}
        {displayPayments.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
            <p className="text-xs text-slate-400">{displayPayments.length} tenants · {filters.month || 'latest month'}</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{totalCollected.toLocaleString()} collected</p>
          </div>
        )}
      </div>

      {tenantHistory && (
        <TenantHistoryModal renterId={tenantHistory.renterId} renterName={tenantHistory.renterName} onClose={() => setTenantHistory(null)} />
      )}
      {showModal && (
        <Modal title={editing ? '✏️ Edit Payment' : '💰 Record Payment'} onClose={closeModal}>
          <PaymentForm payment={editing} onSuccess={onSuccess} onClose={closeModal} />
        </Modal>
      )}
    </div>
  );
}
