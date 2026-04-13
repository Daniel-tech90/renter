import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { renterService } from '../services';

const EMPTY = { name: '', email: '', password: '', phone: '', roomNumber: '', rentAmount: '', dueDate: '', govtIdType: '', govtIdNumber: '' };

export default function RenterForm({ renter, onSuccess, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [govtIdFile, setGovtIdFile] = useState(null);

  useEffect(() => {
    if (renter) setForm({ ...renter, password: '' });
  }, [renter]);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleMarkLeft = async () => {
    setLeaving(true);
    try {
      await renterService.markLeft(renter._id);
      toast.success(`${renter.name} marked as left 🚪`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark as left');
    } finally {
      setLeaving(false);
      setConfirmLeave(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (renter && !payload.password) delete payload.password;
      let saved;
      if (renter) {
        const { data } = await renterService.update(renter._id, payload);
        saved = data;
      } else {
        const { data } = await renterService.create(payload);
        saved = data;
      }
      if (govtIdFile && saved?._id) {
        await renterService.uploadGovtId(saved._id, govtIdFile);
      }
      toast.success(renter ? (renter.isActive ? 'Renter updated!' : 'New tenant created with fresh data!') : 'Renter added!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Name */}
        <div className="col-span-2">
          <label className="input-label">Full Name</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2">👤</span>
            <input name="name" className="input pl-10" value={form.name} onChange={set} required placeholder="John Doe" />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="input-label">Email (for login)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2">✉️</span>
            <input name="email" type="email" className="input pl-10" value={form.email} onChange={set} placeholder="renter@email.com" />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="input-label">{renter ? 'New Password (optional)' : 'Password'}</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2">🔒</span>
            <input
              name="password"
              type={showPass ? 'text' : 'password'}
              className="input pl-10 pr-10"
              value={form.password}
              onChange={set}
              placeholder="••••••••"
              required={!renter}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="input-label">Phone Number</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2">📞</span>
            <input name="phone" className="input pl-10" value={form.phone} onChange={set} required placeholder="9876543210" />
          </div>
        </div>

        {/* Room */}
        <div>
          <label className="input-label">Room Number</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2">🚪</span>
            <input name="roomNumber" className="input pl-10" value={form.roomNumber} onChange={set} required placeholder="101" />
          </div>
        </div>

        {/* Rent */}
        <div>
          <label className="input-label">Monthly Rent (₹)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2">💰</span>
            <input name="rentAmount" type="number" className="input pl-10" value={form.rentAmount} onChange={set} required placeholder="5000" min="1" />
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="input-label">Due Day of Month</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2">📅</span>
            <input name="dueDate" type="number" className="input pl-10" value={form.dueDate} onChange={set} required placeholder="5" min="1" max="31" />
          </div>
          <p className="text-xs text-slate-400 mt-1">e.g. 5 = due on 5th of every month</p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">🪪 Government ID Details</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">ID Type</label>
            <select name="govtIdType" className="input" value={form.govtIdType} onChange={set}>
              <option value="">Select ID Type</option>
              {['Aadhaar Card', 'PAN Card', 'Voter ID', 'Driving License'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">ID Number</label>
            <input name="govtIdNumber" className="input" value={form.govtIdNumber} onChange={set} placeholder="Enter ID number" />
          </div>
        </div>
        <div>
          <label className="input-label">Upload ID Document (Image or PDF)</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setGovtIdFile(e.target.files[0])}
            className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
          />
          {renter?.govtIdDocUrl && !govtIdFile && (
            <a href={renter.govtIdDocUrl} target="_blank" rel="noreferrer" className="text-xs text-violet-600 hover:underline mt-1 inline-block">📎 View uploaded document</a>
          )}
          {govtIdFile && <p className="text-xs text-emerald-600 mt-1">✅ {govtIdFile.name}</p>}
        </div>
      </div>

      {/* Login hint */}
      <div className="bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3 text-xs text-violet-700">
        💡 Renter can login at <strong>/renter-login</strong> using their email & password
      </div>

      {/* Restore notice for left renters */}
      {renter && !renter.isActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">🆕</span>
          <div>
            <p className="text-xs font-bold text-amber-700">This tenant is marked as Left</p>
            <p className="text-xs text-amber-600 mt-0.5">Saving will create a <strong>new tenant record</strong> with fresh data. Old history stays archived for admin.</p>
          </div>
        </div>
      )}

      {/* Mark as Left — only for active renters */}
      {renter && renter.isActive && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          {!confirmLeave ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-700">🚪 Tenant Vacating?</p>
                <p className="text-xs text-red-400 mt-0.5">Mark this renter as left — moves to History</p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmLeave(true)}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-600 font-bold px-4 py-2 rounded-xl transition-all"
              >
                Mark as Left
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-red-700 mb-3">⚠️ Are you sure {renter.name} has left?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleMarkLeft}
                  disabled={leaving}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 rounded-xl transition-all disabled:opacity-60"
                >
                  {leaving ? 'Processing...' : 'Yes, Mark as Left'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmLeave(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
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
          ) : renter ? '✅ Update Renter' : '➕ Add Renter'}
        </button>
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}
