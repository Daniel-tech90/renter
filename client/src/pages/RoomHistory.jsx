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
    api.get(`/history/room/${room}?month=${month}&year=${year}`)
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load room history'))
      .finally(() => setLoading(false));
  }, [room, month, year]);

  const currentPayment = data?.payments?.find(p =>
    p.month === `${year}-${String(month).padStart(2, '0')}` &&
    p.renterId?._id === data?.activeTenant?._id
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-lg">🏠</div>
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Room Tracking</p>
          <p className="text-2xl font-bold text-slate-800">Room History</p>
        </div>
      </div>

      {/* Room Tabs */}
      <div className="card">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Select Room</p>
        <div className="flex flex-wrap gap-2">
          {ROOMS.map(r => (
            <button
              key={r}
              onClick={() => setRoom(r)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                room === r
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-200'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Room {r}
            </button>
          ))}
        </div>
      </div>

      {/* Month Tabs */}
      <div className="card">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Select Month — {year}</p>
        <div className="flex flex-wrap gap-2">
          {MONTHS.map((m, i) => {
            const isCurrentMonth = i + 1 === now.getMonth() + 1;
            return (
              <button
                key={m}
                onClick={() => setMonth(i + 1)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  month === i + 1
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                    : isCurrentMonth
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {m} {isCurrentMonth && month !== i + 1 && <span className="ml-1 text-[9px]">●</span>}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : data && (
        <div className="space-y-6">

          {/* Current Tenant */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800">🏠 Current Tenant — Room {room}</h3>
              {data.activeTenant ? (
                <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-xl font-semibold">● Active</span>
              ) : (
                <span className="text-xs bg-slate-100 text-slate-400 border border-slate-200 px-3 py-1.5 rounded-xl font-semibold">Vacant</span>
              )}
            </div>

            {!data.activeTenant ? (
              <div className="py-10 text-center">
                <div className="text-4xl mb-3">🚪</div>
                <p className="text-slate-500 font-semibold">Room is currently vacant</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Tenant Name', value: data.activeTenant.name },
                  { label: 'Phone', value: `📞 ${data.activeTenant.phone}` },
                  { label: 'Monthly Rent', value: `₹${data.activeTenant.rentAmount?.toLocaleString('en-IN')}` },
                  { label: 'Join Date', value: new Date(data.activeTenant.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                  { label: 'Due Date', value: `${data.activeTenant.dueDate}th of month` },
                  {
                    label: `${MONTHS[month - 1]} Payment`,
                    value: currentPayment ? currentPayment.status : 'No Record',
                    highlight: currentPayment?.status === 'Paid' ? 'green' : currentPayment ? 'red' : 'grey'
                  },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className={`rounded-2xl p-4 ${
                    highlight === 'green' ? 'bg-emerald-50 border border-emerald-100' :
                    highlight === 'red' ? 'bg-red-50 border border-red-100' :
                    'bg-slate-50'
                  }`}>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
                    <p className={`font-bold ${
                      highlight === 'green' ? 'text-emerald-700' :
                      highlight === 'red' ? 'text-red-600' :
                      'text-slate-700'
                    }`}>{value}</p>
                    {highlight === 'green' && currentPayment?.paymentDate && (
                      <p className="text-xs text-emerald-500 mt-0.5">Paid on {new Date(currentPayment.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Payment Summary for selected month */}
          {data.payments.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-slate-800 mb-5">💰 {MONTHS[month - 1]} {year} — Payment Records</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="table-header text-left">Tenant</th>
                      <th className="table-header text-left">Rent</th>
                      <th className="table-header text-left">Electricity</th>
                      <th className="table-header text-left">Total</th>
                      <th className="table-header text-left">Status</th>
                      <th className="table-header text-left">Paid On</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {data.payments.map(p => (
                      <tr key={p._id} className="border-b border-slate-50">
                        <td className="table-cell font-semibold text-slate-700">{p.renterId?.name || '—'}</td>
                        <td className="table-cell text-slate-600">₹{p.amount.toLocaleString('en-IN')}</td>
                        <td className="table-cell text-slate-600">₹{(p.electricityBill || 0).toLocaleString('en-IN')}</td>
                        <td className="table-cell font-bold text-indigo-700">₹{(p.totalAmount || p.amount).toLocaleString('en-IN')}</td>
                        <td className="table-cell">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                            p.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
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
            </div>
          )}

          {/* Past Tenants */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800">🕓 Past Tenants — Room {room}</h3>
              <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-3 py-1.5 rounded-xl">{data.pastTenants.length} records</span>
            </div>

            {data.pastTenants.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-slate-500 font-semibold">No past tenants for this room</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="table-header text-left">Tenant Name</th>
                      <th className="table-header text-left">Joined On</th>
                      <th className="table-header text-left">Left On</th>
                      <th className="table-header text-left">Total Stay</th>
                      <th className="table-header text-left">Total Paid</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {data.pastTenants.map(t => (
                      <tr key={t._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                              {t.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-600">{t.name}</span>
                          </div>
                        </td>
                        <td className="table-cell text-slate-500 text-xs">
                          {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="table-cell">
                          {t.leftAt ? (
                            <span className="bg-red-50 text-red-500 border border-red-100 px-2.5 py-1 rounded-xl text-xs font-semibold">
                              {new Date(t.leftAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="table-cell text-slate-500">
                          {t.totalMonths != null ? `${t.totalMonths} month${t.totalMonths !== 1 ? 's' : ''}` : '—'}
                        </td>
                        <td className="table-cell font-bold text-emerald-700">
                          ₹{t.totalPaid.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
