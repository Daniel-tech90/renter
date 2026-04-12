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
  const [screenshot, setScreenshot] = useState(null); // { paymentId, file }
  const [viewScreenshot, setViewScreenshot] = useState(null); // url to view
  const [uploading, setUploading] = useState(null); // paymentId being uploaded

  const [sending, setSending] = useState(null);
  const [generatingBill, setGeneratingBill] = useState(null);

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
  const downloadBill = async (id) => {
    setGeneratingBill(id);
    try {
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
      const res = await fetch(`${baseURL}/api/payments/${id}/bill`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      if (blob.type !== 'application/pdf') throw new Error('Invalid PDF');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `bill-${id}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Bill downloaded!');
    } catch {
      toast.error('Failed to generate bill');
    } finally {
      setGeneratingBill(null);
    }
  };

  const downloadReceipt = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
      const res = await fetch(`${baseURL}/api/payments/${id}/receipt`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `receipt-${id}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download receipt');
    }
  };

  const handleScreenshotUpload = async (paymentId, file) => {
    if (!file) return;
    setUploading(paymentId);
    try {
      await paymentService.submitScreenshot(paymentId, file);
      toast.success('Screenshot submitted! Awaiting approval.');
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleApprove = async (id) => {
    try {
      await paymentService.approve(id);
      toast.success('Payment approved! WhatsApp sent to renter ✅');
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this payment screenshot?')) return;
    try {
      await paymentService.reject(id);
      toast.success('Payment rejected. Renter notified via WhatsApp.');
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    }
  };

  const handleSendMessage = async (id, type) => {
    setSending(id + type);
    try {
      await paymentService.sendMessage(id, type);
      toast.success(type === 'reminder' ? '⏰ Reminder sent!' : '✅ Confirmation sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(null);
    }
  };

  const paidCount = payments.filter(p => p.status === 'Paid').length;
  const pendingCount = payments.filter(p => p.status === 'Pending').length;
  const reviewCount = payments.filter(p => p.status === 'Under Review').length;
  const totalAmount = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);

  const statusBadge = (status) => {
    if (status === 'Paid') return <span className="badge-paid">✓ Paid</span>;
    if (status === 'Under Review') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">📸 Under Review</span>;
    return <span className="badge-pending">⏳ Pending</span>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: payments.length, icon: '📋', color: 'bg-slate-50 border-slate-200 text-slate-700' },
          { label: 'Paid', value: paidCount, icon: '✅', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          { label: 'Under Review', value: reviewCount, icon: '📸', color: 'bg-blue-50 border-blue-200 text-blue-700' },
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

      {/* Under Review Alert */}
      {reviewCount > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
          <span className="text-2xl">📸</span>
          <div>
            <p className="font-bold text-blue-800">{reviewCount} payment{reviewCount > 1 ? 's' : ''} waiting for your approval!</p>
            <p className="text-blue-600 text-sm">Review the screenshots below and approve or reject.</p>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="card">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <select
              className="input max-w-[180px]"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="Paid">✅ Paid</option>
              <option value="Pending">⏳ Pending</option>
              <option value="Under Review">📸 Under Review</option>
            </select>
            <input
              type="month"
              className="input max-w-[190px]"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            />
            {(filters.status || filters.month) && (
              <button className="btn-secondary text-sm" onClick={() => setFilters({ status: '', month: '' })}>
                ✕ Clear
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
                <th className="table-header text-left">Electricity</th>
                <th className="table-header text-left">Total</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left">Bill</th>
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
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className={`table-row ${p.status === 'Under Review' ? 'bg-blue-50/30' : ''}`}>
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
                    <td className="table-cell font-medium text-slate-600">{p.month}</td>
                    <td className="table-cell font-bold text-slate-800">₹{p.amount.toLocaleString()}</td>
                    <td className="table-cell text-slate-600">₹{(p.electricityBill || 0).toLocaleString()}</td>
                    <td className="table-cell font-bold text-indigo-700">₹{(p.totalAmount || p.amount).toLocaleString()}</td>
                    <td className="table-cell">{statusBadge(p.status)}</td>

                    {/* Bill Column */}
                    <td className="table-cell">
                      <button
                        onClick={() => downloadBill(p._id)}
                        disabled={generatingBill === p._id}
                        className="btn-ghost bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
                      >
                        {generatingBill === p._id ? '⏳' : '🧾'} {generatingBill === p._id ? 'Generating...' : 'Generate Bill'}
                      </button>
                    </td>

                    {/* Actions Column */}
                    <td className="table-cell">
                      <div className="flex items-center gap-2 flex-wrap">
                        {p.status === 'Under Review' && (
                          <>
                            <button onClick={() => handleApprove(p._id)} className="btn-ghost bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-semibold">
                              ✅ Approve
                            </button>
                            <button onClick={() => handleReject(p._id)} className="btn-ghost bg-red-50 text-red-500 hover:bg-red-100">
                              ❌ Reject
                            </button>
                          </>
                        )}
                        {p.status !== 'Under Review' && (
                          <button onClick={() => openEdit(p)} className="btn-ghost bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                            ✏️ Edit
                          </button>
                        )}
                        {p.status === 'Paid' && (
                          <>
                            <button
                              onClick={() => handleSendMessage(p._id, 'confirmation')}
                              disabled={sending === p._id + 'confirmation'}
                              className="btn-ghost bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50"
                            >
                              {sending === p._id + 'confirmation' ? '⏳' : '📱'} Confirm
                            </button>
                            <button onClick={() => downloadReceipt(p._id)} className="btn-ghost bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                              🧾 Receipt
                            </button>
                          </>
                        )}
                        {p.status === 'Pending' && (
                          <button
                            onClick={() => handleSendMessage(p._id, 'reminder')}
                            disabled={sending === p._id + 'reminder'}
                            className="btn-ghost bg-amber-50 text-amber-600 hover:bg-amber-100 disabled:opacity-50"
                          >
                            {sending === p._id + 'reminder' ? '⏳' : '⏰'} Remind
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

        {payments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
            <p className="text-slate-400">{payments.length} records shown</p>
            <p className="font-semibold text-slate-700">
              Total Collected: <span className="text-emerald-600">₹{totalAmount.toLocaleString()}</span>
            </p>
          </div>
        )}
      </div>

      {/* Screenshot Viewer Modal */}
      {viewScreenshot && (
        <div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setViewScreenshot(null)}
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">📸 Payment Screenshot</h3>
              <button onClick={() => setViewScreenshot(null)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 text-lg font-bold">×</button>
            </div>
            <div className="p-4">
              <img src={viewScreenshot} alt="Payment Screenshot" className="w-full rounded-2xl object-contain max-h-[60vh]" />
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title={editing ? '✏️ Edit Payment' : '💰 Record Payment'} onClose={closeModal}>
          <PaymentForm payment={editing} onSuccess={onSuccess} onClose={closeModal} />
        </Modal>
      )}
    </div>
  );
}
