import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const ROOMS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function RoomHistory() {
  const now = new Date();
  const [room, setRoom] = useState('1');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setData(null);
    api.get(`/history/room/${room}?month=${month}&year=${year}`)
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load room history'))
      .finally(() => setLoading(false));
  }, [room, month, year]);

  const currentPayment = data?.payments?.find(p =>
    p.month === `${year}-${String(month).padStart(2, '0')}` &&
    p.renterId?._id === data?.activeTenant?._id
  );

  const isPaid = currentPayment?.status === 'Paid';
  const isPending = currentPayment && currentPayment.status !== 'Paid';

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-lg">🏠</div>
        <div>
          <p className="text-2xl font-bold text-slate-800">Room History</p>
          <p className="text-xs text-slate-400">Track tenants and payments per room</p>
        </div>
      </div>

      {/* Room + Month Selector in one card */}
      <div className="card space-y-4">
        {/* Room Selector */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Room</p>
          <div className="flex flex-wrap gap-2">
            {ROOMS.map(r => (
              <button
                key={r}
                onClick={() => setRoom(r)}
                className={`w-12 h-10 rounded-xl text-sm font-bold transition-all duration-150 ${
                  room === r
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-violet-50 hover:text-violet-600'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Month Selector */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Month — {year}</p>
          <div className="flex flex-wrap gap-2">
            {MONTHS.map((m, i) => {
              const isCurrent = i + 1 === now.getMonth() + 1;
              const isSelected = month === i + 1;
              return (
                <button
                  key={m}
                  onClick={() => setMonth(i + 1)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isSelected
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-100'
                      : isCurrent
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {m}{isCurrent && !isSelected ? ' ●' : ''}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      )}

      {!loading && data && (
        <div className="space-y-5">

          {/* Current Tenant Card */}
          <div className={`rounded-2xl border-2 p-5 ${
            data.activeTenant
              ? isPaid ? 'border-emerald-200 bg-emerald-50/30'
              : isPending ? 'border-red-200 bg-red-50/20'
              : 'border-slate-200 bg-white'
              : 'border-slate-200 bg-slate-50'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏠</span>
                <span className="font-bold text-slate-800">Room {room} — Current Tenant</span>
              </div>
              {data.activeTenant ? (
                <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">● Active</span>
              ) : (
                <span className="text-xs bg-slate-100 text-slate-400 border border-slate-200 px-3 py-1 rounded-full font-bold">Vacant</span>
              )}
            </div>

            {!data.activeTenant ? (
              <div className="py-8 text-center">
                <p className="text-3xl mb-2">🚪</p>
                <p className="text-slate-500 font-semibold">Room is currently vacant</p>
                <p className="text-slate-400 text-xs mt-1">No active tenant assigned</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Tenant info */}
                <div className="bg-white rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-400 mb-1">Tenant</p>
                  <p className="font-bold text-slate-800">{data.activeTenant.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">📞 {data.activeTenant.phone}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-400 mb-1">Monthly Rent</p>
                  <p className="font-bold text-violet-700 text-lg">₹{data.activeTenant.rentAmount?.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Due: {data.activeTenant.dueDate}th</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-400 mb-1">Joined</p>
                  <p className="font-bold text-slate-700">{new Date(data.activeTenant.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>

                {/* Payment status for selected month */}
                <div className={`col-span-2 sm:col-span-3 rounded-xl p-3 border flex items-center justify-between ${
                  isPaid ? 'bg-emerald-50 border-emerald-200' :
                  isPending ? 'bg-red-50 border-red-200' :
                  'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">{MONTHS[month - 1]} {year} — Payment</p>
                    <p className={`font-bold text-sm ${isPaid ? 'text-emerald-700' : isPending ? 'text-red-600' : 'text-slate-500'}`}>
                      {currentPayment ? currentPayment.status : 'No Record'}
                      {isPaid && currentPayment?.paymentDate && (
                        <span className="font-normal text-xs text-emerald-500 ml-2">
                          Paid on {new Date(currentPayment.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </p>
                  </div>
                  {currentPayment && (
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Total</p>
                      <p className={`font-bold ${isPaid ? 'text-emerald-700' : 'text-red-600'}`}>
                        ₹{(currentPayment.totalAmount || currentPayment.amount).toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Payment Records for selected month */}
          {data.payments.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  <span className="font-bold text-slate-800">{MONTHS[month - 1]} {year} — Payments</span>
                </div>
                <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-semibold">{data.payments.length} record{data.payments.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {data.payments.map(p => (
                  <div key={p._id} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                    p.status === 'Paid' ? 'bg-emerald-50 border-emerald-100' :
                    p.status === 'Under Review' ? 'bg-yellow-50 border-yellow-100' :
                    'bg-red-50 border-red-100'
                  }`}>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{p.renterId?.name || '—'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Rent ₹{p.amount.toLocaleString('en-IN')} + Elec ₹{(p.electricityBill || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        p.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                        p.status === 'Under Review' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-600'
                      }`}>{p.status}</span>
                      <p className="font-bold text-slate-800 text-sm mt-1">₹{(p.totalAmount || p.amount).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Tenants */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🕓</span>
                <span className="font-bold text-slate-800">Past Tenants</span>
              </div>
              <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-semibold">{data.pastTenants.length} total</span>
            </div>

            {data.pastTenants.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-slate-500 font-semibold">No past tenants</p>
                <p className="text-slate-400 text-xs mt-1">Previous tenants will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.pastTenants.map((t, idx) => (
                  <div key={t._id} className="flex items-center gap-4 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                    <div className="w-9 h-9 bg-slate-200 rounded-xl flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-700 text-sm">{t.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {t.leftAt && ` → ${new Date(t.leftAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                        {t.totalMonths != null && ` · ${t.totalMonths} month${t.totalMonths !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-400">Total Paid</p>
                      <p className="font-bold text-emerald-700 text-sm">₹{t.totalPaid.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
