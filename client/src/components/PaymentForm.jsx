import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { paymentService, renterService } from '../services';

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function PaymentForm({ payment, onSuccess, onClose }) {
  const [form, setForm] = useState({
    renterId: '', month: currentMonth(), amount: '',
    status: 'Pending', paymentDate: '', notes: '',
  });
  const [renters, setRenters] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    renterService.getAll().then(({ data }) => setRenters(data));
    if (payment) {
      setForm({
        renterId: payment.renterId?._id || payment.renterId,
        month: payment.month,
        amount: payment.amount,
        status: payment.status,
        paymentDate: payment.paymentDate ? payment.paymentDate.slice(0, 10) : '',
        notes: payment.notes || '',
      });
    }
  }, [payment]);

  const set = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    if (e.target.name === 'renterId') {
      const r = renters.find((r) => r._id === e.target.value);
      if (r) updated.amount = r.rentAmount;
    }
    setForm(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.paymentDate) delete payload.paymentDate;
      payment ? await paymentService.update(payment._id, payload) : await paymentService.create(payload);
      toast.success(payment ? 'Payment updated!' : 'Payment recorded!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Renter Select */}
      <div>
        <label className="input-label">Select Tenant</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">👤</span>
          <select name="renterId" className="input pl-10" value={form.renterId} onChange={set} required disabled={!!payment}>
            <option value="">Choose a renter...</option>
            {renters.map((r) => (
              <option key={r._id} value={r._id}>{r.name} — Room {r.roomNumber}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="input-label">Month</label>
          <input name="month" type="month" className="input" value={form.month} onChange={set} required disabled={!!payment} />
        </div>
        <div>
          <label className="input-label">Amount (₹)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">💰</span>
            <input name="amount" type="number" className="input pl-10" value={form.amount} onChange={set} required min="1" placeholder="5000" />
          </div>
        </div>
        <div>
          <label className="input-label">Payment Status</label>
          <select name="status" className="input" value={form.status} onChange={set}>
            <option value="Pending">⏳ Pending</option>
            <option value="Paid">✅ Paid</option>
          </select>
        </div>
        <div>
          <label className="input-label">Payment Date</label>
          <input name="paymentDate" type="date" className="input" value={form.paymentDate} onChange={set} />
        </div>
      </div>

      <div>
        <label className="input-label">Notes (optional)</label>
        <input name="notes" className="input" value={form.notes} onChange={set} placeholder="Any additional notes..." />
      </div>

      {/* Status indicator */}
      {form.status === 'Paid' && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-sm text-emerald-700">
          <span>📱</span>
          <span className="font-medium">A WhatsApp confirmation will be sent to the tenant.</span>
        </div>
      )}

      <div className="flex gap-3 pt-2 border-t border-slate-100">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Saving...
            </span>
          ) : payment ? '✅ Update Payment' : '💾 Record Payment'}
        </button>
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}
