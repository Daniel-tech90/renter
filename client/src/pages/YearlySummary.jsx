import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { paymentService } from '../services';
import Modal from '../components/Modal';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function MonthGrid({ renterId, year }) {
  const [monthData, setMonthData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentService.getByRenter(renterId)
      .then(({ data }) => {
        const map = {};
        data.forEach(p => { map[p.month] = p; });
        setMonthData(map);
      })
      .finally(() => setLoading(false));
  }, [renterId]);

  if (loading) return <div className="w-4 h-4 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />;

  return (
    <div className="flex gap-2 flex-wrap">
      {MONTH_NAMES.map((name, i) => {
        const month = `${year}-${String(i + 1).padStart(2, '0')}`;
        const record = monthData[month];
        const status = record?.status;

        let bg, text, border, icon, shadow, tooltip;
        if (!status || status === 'Room Closed') {
          bg = 'bg-slate-100 hover:bg-slate-200';
          text = 'text-slate-400';
          border = 'border-slate-200';
          icon = '⛔';
          shadow = '';
          tooltip = `${name} ${year} — Room Closed`;
        } else if (status === 'Paid') {
          bg = 'bg-emerald-50 hover:bg-emerald-100';
          text = 'text-emerald-700';
          border = 'border-emerald-300';
          icon = '✔';
          shadow = 'shadow-emerald-100';
          tooltip = `${name} ${year} — Paid ₹${(record.totalAmount || record.amount || 0).toLocaleString('en-IN')}`;
        } else {
          bg = 'bg-red-50 hover:bg-red-100';
          text = 'text-red-600';
          border = 'border-red-300';
          icon = '⚠️';
          shadow = 'shadow-red-100';
          tooltip = `${name} ${year} — Due ₹${(record.totalAmount || record.amount || 0).toLocaleString('en-IN')}`;
        }

        return (
          <div
            key={month}
            title={tooltip}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full border
              ${bg} ${text} ${border} shadow-sm ${shadow}
              cursor-pointer select-none
              transition-all duration-200 hover:scale-105 hover:shadow-md
              text-xs font-bold
            `}
          >
            <span className="text-[10px]">{icon}</span>
            <span>{name}</span>
          </div>
        );
      })}
    </div>
  );
}

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
                    <tr key={p._id} className={`border-b border-slate-50 ${p.status === 'Room Closed' ? 'bg-slate-50/80 opacity-60' : 'hover:bg-slate-50/50'}`}>
                      <td className="table-cell font-semibold text-slate-700">{p.month}</td>
                      <td className="table-cell text-slate-700">{p.status === 'Room Closed' ? '—' : `₹${p.amount.toLocaleString('en-IN')}`}</td>
                      <td className="table-cell text-slate-500">{p.status === 'Room Closed' ? '—' : `${p.unitsConsumed || 0} u`}</td>
                      <td className="table-cell text-slate-600">{p.status === 'Room Closed' ? '—' : `₹${(p.electricityBill || 0).toLocaleString('en-IN')}`}</td>
                      <td className="table-cell font-bold text-indigo-700">{p.status === 'Room Closed' ? '—' : `₹${(p.totalAmount || p.amount).toLocaleString('en-IN')}`}</td>
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

export default function YearlySummary() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [tenantHistory, setTenantHistory] = useState(null);

  useEffect(() => {
    setLoading(true);
    paymentService.getYearlySummary(year)
      .then(({ data }) => setSummary(data))
      .catch(() => toast.error('Failed to load summary'))
      .finally(() => setLoading(false));
  }, [year]);

  const totalCollected = summary.reduce((s, t) => s + t.totalPaid, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-xl shadow-lg">📅</div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Annual</p>
            <p className="text-2xl font-bold text-slate-800">Yearly Summary</p>
          </div>
        </div>
        <select className="input max-w-[140px]" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Tenants', value: summary.length, icon: '👥', color: 'bg-slate-50 border-slate-200 text-slate-700' },
          { label: 'Total Collected', value: `₹${totalCollected.toLocaleString('en-IN')}`, icon: '💰', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          { label: 'Fully Paid', value: summary.filter(t => t.monthsPaid === 12).length, icon: '✅', color: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Has Dues', value: summary.filter(t => t.monthsPending > 0).length, icon: '⏳', color: 'bg-amber-50 border-amber-200 text-amber-700' },
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

      {/* Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-800">Tenant-wise Summary — {year}</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-300 text-emerald-700 px-2.5 py-1 rounded-full">✔ Paid</span>
              <span className="flex items-center gap-1 bg-red-50 border border-red-300 text-red-600 px-2.5 py-1 rounded-full">⚠️ Due</span>
              <span className="flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-400 px-2.5 py-1 rounded-full">⛔ Closed</span>
            </div>
            <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-3 py-1.5 rounded-xl">{summary.length} tenants</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : summary.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-500 font-semibold">No data for {year}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-header text-left">Tenant</th>
                  <th className="table-header text-left">Room</th>
                  <th className="table-header text-center">Months Paid</th>
                  <th className="table-header text-center">Months Due</th>
                  <th className="table-header text-left">Total Paid</th>
                  <th className="table-header text-left">Month Status</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {summary.map((t) => (
                  <tr key={t.renter._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-xl flex items-center justify-center text-xs font-bold text-violet-600 flex-shrink-0">
                          {t.renter.name.slice(0, 2).toUpperCase()}
                        </div>
                        <button
                          onClick={() => setTenantHistory({ renterId: t.renter._id, renterName: t.renter.name })}
                          className="font-semibold text-slate-800 hover:text-violet-600 hover:underline transition-colors text-left"
                        >
                          {t.renter.name}
                        </button>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="bg-violet-50 text-violet-700 border border-violet-100 px-2.5 py-1 rounded-lg text-xs font-bold">
                        Room {t.renter.roomNumber}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-sm font-bold text-emerald-600">{t.monthsPaid}</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-sm text-slate-400">12</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(t.monthsPaid / 12) * 100}%` }} />
                      </div>
                    </td>
                    <td className="table-cell text-center">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                        t.monthsPending === 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'
                      }`}>
                        {t.monthsPending === 0 ? '✅ All Paid' : `${t.monthsPending} due`}
                      </span>
                    </td>
                    <td className="table-cell font-bold text-emerald-700">₹{t.totalPaid.toLocaleString('en-IN')}</td>
                    <td className="table-cell"><MonthGrid renterId={t.renter._id} year={year} /></td>
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
