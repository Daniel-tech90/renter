import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { renterService } from '../services';

const EMPTY = { name: '', phone: '', roomNumber: '', rentAmount: '', dueDate: '' };

export default function RenterForm({ renter, onSuccess, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (renter) setForm({ name: renter.name, phone: renter.phone, roomNumber: renter.roomNumber, rentAmount: renter.rentAmount, dueDate: renter.dueDate });
  }, [renter]);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      renter ? await renterService.update(renter._id, form) : await renterService.create(form);
      toast.success(renter ? 'Renter updated!' : 'Renter added!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'name', label: 'Full Name', icon: '👤', placeholder: 'John Doe', type: 'text', col: 2 },
    { name: 'phone', label: 'Phone Number', icon: '📞', placeholder: '9876543210', type: 'text', col: 1 },
    { name: 'roomNumber', label: 'Room Number', icon: '🚪', placeholder: '101', type: 'text', col: 1 },
    { name: 'rentAmount', label: 'Monthly Rent (₹)', icon: '💰', placeholder: '5000', type: 'number', col: 1 },
    { name: 'dueDate', label: 'Due Day of Month', icon: '📅', placeholder: '5', type: 'number', col: 1 },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {fields.map(({ name, label, icon, placeholder, type, col }) => (
          <div key={name} className={col === 2 ? 'col-span-2' : ''}>
            <label className="input-label">{label}</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">{icon}</span>
              <input
                name={name}
                type={type}
                className="input pl-10"
                placeholder={placeholder}
                value={form[name]}
                onChange={set}
                required
                min={type === 'number' ? 1 : undefined}
                max={name === 'dueDate' ? 31 : undefined}
              />
            </div>
            {name === 'dueDate' && (
              <p className="text-xs text-slate-400 mt-1">e.g. 5 = rent due on the 5th of every month</p>
            )}
          </div>
        ))}
      </div>

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
