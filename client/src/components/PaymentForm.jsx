import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { paymentService, renterService } from '../services';

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function PaymentForm({ payment, onSuccess, onClose }) {
  const [form, setForm] = useState({
    renterId: '', month: currentMonth(), amount: '',
    prevReading: '0', currReading: '0', ratePerUnit: '0',
    status: 'Pending', paymentDate: '', notes: '',
    isAdvance: false, advanceAmount: '0',
  });
  const [renters, setRenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [advanceBalance, setAdvanceBalance] = useState(0);

  useEffect(() => {
    renterService.getAll().then(({ data }) => setRenters(data.filter(r => r.isActive)));
    if (payment) {
      setForm({
        renterId: payment.renterId?._id || payment.renterId,
        month: payment.month,
        amount: payment.amount,
        prevReading: payment.prevReading ?? '0',
        currReading: payment.currReading ?? '0',
        ratePerUnit: payment.ratePerUnit ?? '0',
        status: payment.status,
        paymentDate: payment.paymentDate ? payment.paymentDate.slice(0, 10) : '',
        notes: payment.notes || '',
        isAdvance: false, advanceAmount: '0',
      });
      // Fetch advance balance for existing payment
      const rid = payment.renterId?._id || payment.renterId;
      if (rid) paymentService.getAdvanceBalance(rid).then(({ data }) => setAdvanceBalance(data.advanceBalance || 0)).catch(() => {});
    }
  }, [payment]);

  const set = async (e) => {
    const { name, value, type, checked } = e.target;
    const updated = { ...form, [name]: type === 'checkbox' ? checked : value };
    if (name === 'renterId' && value) {
      const r = renters.find(r => r._id === value);
      if (r) updated.amount = r.rentAmount;
      try {
        const [readingRes, advRes] = await Promise.all([
          paymentService.getLastReading(value),
          paymentService.getAdvanceBalance(value),
        ]);
        updated.prevReading = readingRes.data.prevReading;
        setAdvanceBalance(advRes.data.advanceBalance || 0);
      } catch { updated.prevReading = 0; }
    }
    setForm(updated);
    setError('');
  };

  const prev = Number(form.prevReading) || 0;
  const curr = Number(form.currReading) || 0;
  const rate = Number(form.ratePerUnit) || 0;
  const units = Math.max(0, curr - prev);
  const elecBill = units * rate;
  const total = (Number(form.amount) || 0) + elecBill;

  // Advance adjustment preview
  const advUsed = Math.min(advanceBalance, total);
  const remaining = total - advUsed;
  const newBalance = advanceBalance - advUsed;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (curr < prev) { setError('Current reading must be ≥ previous reading'); return; }
    if (form.isAdvance && Number(form.advanceAmount) <= 0) { setError('Enter a valid advance amount'); return; }
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.paymentDate) delete payload.paymentDate;
      let res;
      if (payment) {
        res = await paymentService.update(payment._id, payload);
      } else {
        res = await paymentService.create(payload);
      }
      const newAdv = res.data?.advanceBalance;
      if (newAdv !== undefined) setAdvanceBalance(newAdv);
      toast.success(form.isAdvance ? `Advance of ₹${form.advanceAmount} added!` : payment ? 'Payment updated!' : 'Payment recorded!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Renter */}
      <div>
        <label className="input-label">Select Tenant</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">👤</span>
          <select name="renterId" className="input pl-10" value={form.renterId} onChange={set} required disabled={!!payment}>
            <option value="">Choose a renter...</option>
            {renters.map(r => (
              <option key={r._id} value={r._id}>{r.name} — Room {r.roomNumber}</option>
            ))}
          </select>
        </div>
        {/* Advance Balance Badge */}
        {form.renterId && advanceBalance > 0 && (
          <div className="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
            <span className="text-blue-500 text-sm">💳</span>
            <span className="text-xs font-semibold text-blue-700">Advance Balance: ₹{advanceBalance.toLocaleString('en-IN')}</span>
            <span className="text-xs text-blue-500 ml-auto">Will be auto-adjusted</span>
          </div>
        )}
      </div>

      {/* Advance Payment Toggle */}
      {!payment && (
        <div className={`rounded-2xl border-2 p-4 transition-all ${form.isAdvance ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isAdvance"
              checked={form.isAdvance}
              onChange={set}
              className="w-4 h-4 accent-blue-600"
            />
            <div>
              <p className="text-sm font-bold text-slate-700">💳 Advance Payment</p>
              <p className="text-xs text-slate-400">Store advance — auto-adjusted in future bills</p>
            </div>
          </label>
          {form.isAdvance && (
            <div className="mt-3">
              <label className="input-label">Advance Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2">💰</span>
                <input
                  name="advanceAmount"
                  type="number"
                  className="input pl-10"
                  value={form.advanceAmount}
                  onChange={set}
                  min="1"
                  placeholder="Enter advance amount"
                />
              </div>
              <p className="text-xs text-blue-600 mt-1.5 font-medium">
                New balance after adding: ₹{(advanceBalance + (Number(form.advanceAmount) || 0)).toLocaleString('en-IN')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Normal payment fields — hidden when advance only */}
      {!form.isAdvance && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Month</label>
              <input name="month" type="month" className="input" value={form.month} onChange={set} required />
            </div>
            <div>
              <label className="input-label">Rent Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2">💰</span>
                <input name="amount" type="number" className="input pl-10" value={form.amount} onChange={set} required min="1" placeholder="5000" />
              </div>
            </div>
          </div>

          {/* Electricity */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">⚡ Electricity Details</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Previous Reading (units)</label>
                <input name="prevReading" type="number" className="input" value={form.prevReading} onChange={set} min="0" />
              </div>
              <div>
                <label className="input-label">Current Reading (units)</label>
                <input name="currReading" type="number" className="input" value={form.currReading} onChange={set} min="0" />
              </div>
              <div>
                <label className="input-label">Rate per Unit (₹)</label>
                <input name="ratePerUnit" type="number" className="input" value={form.ratePerUnit} onChange={set} min="0" step="0.01" />
              </div>
              <div>
                <label className="input-label">Units Consumed</label>
                <input className="input bg-slate-50 text-slate-500" value={`${units} units`} readOnly />
              </div>
            </div>
            {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
            <div className="flex items-center justify-between bg-white rounded-xl px-4 py-2 border border-amber-200">
              <span className="text-xs font-semibold text-amber-700">Electricity Bill</span>
              <span className="font-bold text-amber-700">₹{elecBill.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          {/* Total with advance preview */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-indigo-600 space-y-0.5">
                <p>Rent: ₹{(Number(form.amount) || 0).toLocaleString('en-IN')}</p>
                <p>Electricity: ₹{elecBill.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-indigo-500 font-medium">Total Due</p>
                <p className="text-xl font-bold text-indigo-700">₹{total.toLocaleString('en-IN')}</p>
              </div>
            </div>
            {advanceBalance > 0 && (
              <div className="border-t border-indigo-200 pt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600 font-semibold">💳 Advance Used</span>
                  <span className="font-bold text-blue-700">- ₹{advUsed.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Remaining to Pay</span>
                  <span className={`font-bold ${remaining === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ₹{remaining.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">New Advance Balance</span>
                  <span className="font-semibold text-slate-600">₹{newBalance.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}
          </div>

          {form.status === 'Paid' && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-sm text-emerald-700">
              <span>📱</span>
              <span className="font-medium">A WhatsApp confirmation will be sent to the tenant.</span>
            </div>
          )}
        </>
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
          ) : form.isAdvance ? '💳 Add Advance' : payment ? '✅ Update Payment' : '💾 Record Payment'}
        </button>
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}
