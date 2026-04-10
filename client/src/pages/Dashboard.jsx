import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from 'recharts';
import StatCard from '../components/StatCard';
import { dashboardService } from '../services';

const COLORS = ['#7C3AED', '#F59E0B'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-3 text-sm">
        <p className="font-semibold text-slate-600 mb-1">{label}</p>
        <p className="text-violet-600 font-bold">₹{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getStats()
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm font-medium">Loading dashboard...</p>
      </div>
    </div>
  );
  if (!stats) return null;

  const { totalRenters, currentMonth, monthlyIncome } = stats;
  const collectionRate = currentMonth.paid + currentMonth.pending > 0
    ? Math.round((currentMonth.paid / (currentMonth.paid + currentMonth.pending)) * 100)
    : 0;

  const pieData = [
    { name: 'Paid', value: currentMonth.paid },
    { name: 'Pending', value: currentMonth.pending },
  ];

  const barData = monthlyIncome.map((m) => ({ month: m._id, income: m.totalIncome }));

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Renters" value={totalRenters} icon="👥" color="indigo" trend="Active tenants" />
        <StatCard label="Paid This Month" value={currentMonth.paid} icon="✅" color="green" trend={`₹${currentMonth.paidAmount.toLocaleString()} collected`} />
        <StatCard label="Pending This Month" value={currentMonth.pending} icon="⏳" color="yellow" trend={`₹${currentMonth.pendingAmount.toLocaleString()} outstanding`} />
        <StatCard label="Collection Rate" value={`${collectionRate}%`} icon="📈" color="blue" trend="This month" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bar Chart — takes 2 cols */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800">Monthly Income</h3>
              <p className="text-xs text-slate-400 mt-0.5">Last 6 months revenue</p>
            </div>
            <span className="text-xs bg-violet-50 text-violet-600 font-semibold px-3 py-1.5 rounded-xl border border-violet-100">
              ₹ INR
            </span>
          </div>
          {barData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-300">
              <span className="text-4xl mb-2">📊</span>
              <p className="text-sm">No income data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f3ff', radius: 8 }} />
                <Bar dataKey="income" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="card">
          <div className="mb-6">
            <h3 className="font-bold text-slate-800">Payment Status</h3>
            <p className="text-xs text-slate-400 mt-0.5">Current month breakdown</p>
          </div>
          {currentMonth.paid + currentMonth.pending === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-300">
              <span className="text-4xl mb-2">🥧</span>
              <p className="text-sm">No records yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={4}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} strokeWidth={0} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} renters`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-xs text-slate-500 font-medium">{d.name}: <strong className="text-slate-700">{d.value}</strong></span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-800">Current Month Payments</h3>
            <p className="text-xs text-slate-400 mt-0.5">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-3 py-1.5 rounded-xl">
            {currentMonth.payments.length} records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-header text-left">Renter</th>
                <th className="table-header text-left">Room</th>
                <th className="table-header text-left">Amount</th>
                <th className="table-header text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentMonth.payments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="text-3xl mb-2">📋</div>
                    <p className="text-slate-400 text-sm">No payment records this month</p>
                  </td>
                </tr>
              ) : (
                currentMonth.payments.map((p) => (
                  <tr key={p._id} className="table-row">
                    <td className="table-cell font-semibold text-slate-800">{p.renterId?.name}</td>
                    <td className="table-cell">
                      <span className="bg-violet-50 text-violet-700 border border-violet-100 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        Room {p.renterId?.roomNumber}
                      </span>
                    </td>
                    <td className="table-cell font-semibold">₹{p.amount.toLocaleString()}</td>
                    <td className="table-cell">
                      <span className={p.status === 'Paid' ? 'badge-paid' : 'badge-pending'}>
                        {p.status === 'Paid' ? '✓' : '⏳'} {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
