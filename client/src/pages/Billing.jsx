import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { billingService, renterService } from '../services';
import Modal from '../components/Modal';

const EMPTY = {
  renterId: '', month: '', prevReading: '', currReading: '',
  costPerUnit: '', monthlyRent: '', additionalCharges: '',
  additionalNote: '', dueDate: '', status: 'Unpaid',
};

function BillForm({ bill, renters, onSuccess, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bill) {
      setForm({ ...bill, renterId: bill.renterId?._id || bill.renterId });
    } else {
      setForm(EMPTY);
    }
  }, [bill]);

  // Auto-fill rent when renter selected
  const handleRenterChange = (e) => {
    const r = renters.find((r) => r._id === e.target.value);
    setForm((f) => ({ ...f, renterId: e.target.value, monthlyRent: r ? r.rentAmount : '' }));
  };

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const units = form.currReading && form.prevReading ? Math.max(0, form.currReading - form.prevReading) : 0;
  const elec  = units * (Number(form.costPerUnit) || 0);
  const total = (Number(form.monthlyRent) || 0) + elec + (Number(form.additionalCharges) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(form.currReading) < Number(form.prevReading))
      return toast.error('Current reading must be ≥ previous reading');
    setLoading(true);
    try {
      bill ? await billingService.update(bill._id, form) : await billingService.create(form);
      toast.success(bill ? 'Bill updated!' : 'Bill created!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400 transition-all';
  const labelCls = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Renter + Month */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelCls}>Tenant</label>
          <select name="renterId" className={inputCls} value={form.renterId} onChange={handleRenterChange} required>
            <option value="">Select tenant...</option>
            {renters.map((r) => (
              <option key={r._id} value={r._id}>{r.name} — Room {r.roomNumber}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Month (YYYY-MM)</label>
          <input name="month" className={inputCls} value={form.month} onChange={set} placeholder="2024-01" required />
        </div>
        <div>
          <label className={labelCls}>Due Date</label>
          <input name="dueDate" type="date" className={inputCls} value={form.dueDate} onChange={set} required />
        </div>
      </div>

      {/* Meter Readings */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">⚡ Electricity</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Previous Reading (units)</label>
            <input name="prevReading" type="number" className={inputCls} value={form.prevReading} onChange={set} placeholder="1200" required min="0" />
          </div>
          <div>
            <label className={labelCls}>Current Reading (units)</label>
            <input name="currReading" type="number" className={inputCls} value={form.currReading} onChange={set} placeholder="1350" required min="0" />
          </div>
          <div>
            <label className={labelCls}>Cost per Unit (₹)</label>
            <input name="costPerUnit" type="number" className={inputCls} value={form.costPerUnit} onChange={set} placeholder="8" required min="0" step="0.01" />
          </div>
          <div>
            <label className={labelCls}>Units Consumed</label>
            <div className="bg-blue-100 border border-blue-200 rounded-xl px-3 py-2 text-sm font-bold text-blue-700">{units} units</div>
          </div>
        </div>
        <div className="bg-blue-100 border border-blue-200 rounded-xl px-3 py-2 text-sm font-bold text-blue-700">
          Electricity Bill: ₹{elec.toLocaleString('en-IN')}
        </div>
      </div>

      {/* Rent + Additional */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Monthly Rent (₹)</label>
          <input name="monthlyRent" type="number" className={inputCls} value={form.monthlyRent} onChange={set} placeholder="5000" required min="0" />
        </div>
        <div>
          <label className={labelCls}>Additional Charges (₹)</label>
          <input name="additionalCharges" type="number" className={inputCls} value={form.additionalCharges} onChange={set} placeholder="0" min="0" />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Additional Note (optional)</label>
          <input name="additionalNote" className={inputCls} value={form.additionalNote} onChange={set} placeholder="e.g. Water charges" />
        </div>
      </div>

      {/* Total */}
      <div className="bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-violet-700">Total Amount</span>
        <span className="text-xl font-extrabold text-violet-700">₹{total.toLocaleString('en-IN')}</span>
      </div>

      <div className="flex gap-3 pt-2 border-t border-slate-100">
        <button type="submit" disabled={loading}
          className="flex-1 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-60">
          {loading ? 'Saving...' : bill ? '✅ Update Bill' : '🧾 Create Bill'}
        </button>
        <button type="button" onClick={onClose}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function Billing() {
  const [bills, setBills] = useState([]);
  const [renters, setRenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  const [sending, setSending] = useState(null);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterMonth)  params.month  = filterMonth;
      const { data } = await billingService.getAll(params);
      setBills(data);
    } catch {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterMonth]);

  useEffect(() => { fetchBills(); }, [fetchBills]);
  useEffect(() => { renterService.getAll().then(({ data }) => setRenters(data)); }, []);

  const handleMarkPaid = async (id, name) => {
    if (!window.confirm(`Mark bill for ${name} as Paid?`)) return;
    try {
      await billingService.markPaid(id);
      toast.success('Marked as Paid ✅');
      fetchBills();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bill?')) return;
    try {
      await billingService.remove(id);
      toast.success('Bill deleted');
      fetchBills();
    } catch { toast.error('Failed to delete'); }
  };

  const downloadReceipt = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/billing/${id}/receipt`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `bill-${id}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download receipt'); }
  };

  const handleWhatsApp = async (bill) => {
    // Open WhatsApp Web with pre-filled message as fallback
    const phone = bill.renterId?.phone;
    const msg = encodeURIComponent(
`🏠 *Ramesh Rental Portal*

Dear *${bill.renterId?.name}*,

Your bill for *${bill.month}* is ready.

📋 *Bill Summary:*
• Room: ${bill.renterId?.roomNumber}
• Monthly Rent: ₹${bill.monthlyRent.toLocaleString('en-IN')}
• Electricity (${bill.unitsConsumed} units): ₹${bill.electricityBill.toLocaleString('en-IN')}
• Additional: ₹${(bill.additionalCharges || 0).toLocaleString('en-IN')}

💰 *Total Amount: ₹${bill.totalAmount.toLocaleString('en-IN')}*
📅 Due Date: ${bill.dueDate}
🔖 Status: ${bill.status}

Please pay before the due date. Thank you! 🙏
- Ramesh Sahu`
    );
    // Try Twilio first
    setSending(bill._id);
    try {
      await billingService.sendWhatsApp(bill._id);
      toast.success('WhatsApp message sent via Twilio! 📱');
    } catch {
      // Fallback: open WhatsApp Web
      toast('Opening WhatsApp Web...', { icon: '📱' });
      window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
    } finally {
      setSending(null);
    }
  };

  const totalUnpaid = bills.filter((b) => b.status === 'Unpaid').reduce((s, b) => s + b.totalAmount, 0);
  const totalPaid   = bills.filter((b) => b.status === 'Paid').reduce((s, b) => s + b.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-blue-200">🧾</div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Manage</p>
            <p className="text-2xl font-bold text-slate-800">Billing</p>
          </div>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }}
          className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-violet-200 transition-all">
          ＋ Create Bill
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Bills', value: bills.length, icon: '🧾', color: 'from-slate-500 to-slate-700', shadow: 'shadow-slate-200' },
          { label: 'Total Unpaid', value: `₹${totalUnpaid.toLocaleString('en-IN')}`, icon: '⏳', color: 'from-red-400 to-rose-500', shadow: 'shadow-red-200' },
          { label: 'Total Collected', value: `₹${totalPaid.toLocaleString('en-IN')}`, icon: '✅', color: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-200' },
        ].map(({ label, value, icon, color, shadow }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center text-xl shadow-lg ${shadow} flex-shrink-0`}>{icon}</div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
              <p className="text-xl font-bold text-slate-800 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
        <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Paid">Paid</option>
        </select>
        <input type="month" className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
          value={filterMonth} onChange={(e) => setFilterMonth(e.target.value ? e.target.value : '')} />
        {(filterStatus || filterMonth) && (
          <button onClick={() => { setFilterStatus(''); setFilterMonth(''); }}
            className="text-sm text-slate-400 hover:text-slate-600 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all">
            ✕ Clear
          </button>
        )}
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                {['Tenant', 'Month', 'Electricity', 'Rent', 'Additional', 'Total', 'Due Date', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr><td colSpan={9} className="py-16 text-center">
                  <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Loading bills...</p>
                </td></tr>
              ) : bills.length === 0 ? (
                <tr><td colSpan={9} className="py-16 text-center">
                  <div className="text-4xl mb-3">🧾</div>
                  <p className="text-slate-500 font-semibold">No bills found</p>
                  <p className="text-slate-400 text-sm mt-1">Create your first bill to get started</p>
                </td></tr>
              ) : bills.map((b) => (
                <tr key={b._id} className={`border-b border-slate-50 transition-colors ${b.status === 'Unpaid' ? 'hover:bg-red-50/30' : 'hover:bg-emerald-50/30'}`}>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-xl flex items-center justify-center text-xs font-bold text-violet-600 flex-shrink-0">
                        {b.renterId?.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{b.renterId?.name}</p>
                        <p className="text-xs text-slate-400">Room {b.renterId?.roomNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell font-semibold text-slate-700">{b.month}</td>
                  <td className="table-cell text-sm">
                    <p className="font-semibold text-slate-700">₹{b.electricityBill.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-slate-400">{b.unitsConsumed} units</p>
                  </td>
                  <td className="table-cell font-semibold text-slate-700">₹{b.monthlyRent.toLocaleString('en-IN')}</td>
                  <td className="table-cell text-slate-500 text-sm">₹{(b.additionalCharges || 0).toLocaleString('en-IN')}</td>
                  <td className="table-cell">
                    <span className="font-extrabold text-slate-800">₹{b.totalAmount.toLocaleString('en-IN')}</span>
                  </td>
                  <td className="table-cell text-xs text-slate-500">{b.dueDate}</td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${b.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                      {b.status === 'Paid' ? '✓ Paid' : '⏳ Unpaid'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {b.status === 'Unpaid' && (
                        <button onClick={() => handleMarkPaid(b._id, b.renterId?.name)}
                          className="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-xl font-semibold transition-all">
                          ✓ Paid
                        </button>
                      )}
                      <button onClick={() => handleWhatsApp(b)} disabled={sending === b._id}
                        className="text-xs bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 px-2.5 py-1.5 rounded-xl font-semibold transition-all disabled:opacity-50">
                        {sending === b._id ? '⏳' : '📱'} WhatsApp
                      </button>
                      <button onClick={() => downloadReceipt(b._id)}
                        className="text-xs bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-200 px-2.5 py-1.5 rounded-xl font-semibold transition-all">
                        🧾 PDF
                      </button>
                      <button onClick={() => { setEditing(b); setShowModal(true); }}
                        className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-xl font-semibold transition-all">
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(b._id)}
                        className="text-xs bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-xl font-semibold transition-all">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editing ? '✏️ Edit Bill' : '🧾 Create New Bill'} onClose={() => { setShowModal(false); setEditing(null); }}>
          <BillForm bill={editing} renters={renters} onSuccess={() => { setShowModal(false); setEditing(null); fetchBills(); }} onClose={() => { setShowModal(false); setEditing(null); }} />
        </Modal>
      )}
    </div>
  );
}
