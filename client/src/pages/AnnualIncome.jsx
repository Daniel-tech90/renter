import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { paymentService } from '../services';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const NOW = new Date();
const CURRENT_MONTH = NOW.getMonth(); // 0-indexed
const CURRENT_YEAR  = NOW.getFullYear();

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const dateStr = NOW.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export default function AnnualIncome() {
  const [year, setYear]       = useState(CURRENT_YEAR);
  const [summary, setSummary] = useState([]);
  const [monthMap, setMonthMap] = useState({}); // { renterId: { 'YYYY-MM': payment } }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    paymentService.getYearlySummary(year)
      .then(async ({ data }) => {
        setSummary(data);
        // Fetch per-renter month data
        const map = {};
        await Promise.all(data.map(async (t) => {
          try {
            const { data: payments } = await paymentService.getByRenter(t.renter._id);
            map[t.renter._id] = {};
            payments.forEach(p => { map[t.renter._id][p.month] = p; });
          } catch {}
        }));
        setMonthMap(map);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, [year]);

  // Monthly income totals
  const monthlyIncome = MONTHS.map((_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`;
    return summary.reduce((sum, t) => {
      const p = monthMap[t.renter._id]?.[key];
      return sum + (p?.status === 'Paid' ? (p.totalAmount || p.amount || 0) : 0);
    }, 0);
  });

  const annualTotal = monthlyIncome.reduce((s, v) => s + v, 0);
  const paidTenants = summary.filter(t => t.monthsPaid > 0).length;
  const pendingCount = summary.filter(t => t.monthsPending > 0).length;

  const cellStatus = (renterId, monthIdx) => {
    const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
    const p = monthMap[renterId]?.[key];
    if (!p || p.status === 'Room Closed') return 'closed';
    if (p.status === 'Paid') return 'paid';
    return 'unpaid';
  };

  const cellAmount = (renterId, monthIdx) => {
    const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
    const p = monthMap[renterId]?.[key];
    return p?.status === 'Paid' ? (p.totalAmount || p.amount || 0) : 0;
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
            <span>📅</span>
            <span>{dateStr}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Annual Income Overview</h1>
          <p className="text-xs text-slate-400 mt-0.5">Track monthly rent payments across all tenants</p>
        </div>
        <select className="input max-w-[130px]" value={year} onChange={e => setYear(Number(e.target.value))}>
          {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* ── Section 1: Annual Total Income ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-100">
          <p className="text-xs font-semibold opacity-80 uppercase tracking-wide mb-1">Annual Total Income</p>
          <p className="text-3xl font-bold">{fmt(annualTotal)}</p>
          <p className="text-xs opacity-70 mt-1">{year} collected</p>
        </div>
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Total Tenants</p>
          <p className="text-2xl font-bold text-slate-800">{summary.length}</p>
        </div>
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Active Payers</p>
          <p className="text-2xl font-bold text-emerald-600">{paidTenants}</p>
        </div>
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Has Dues</p>
          <p className="text-2xl font-bold text-red-500">{pendingCount}</p>
        </div>
      </div>

      {/* ── Section 2: Monthly Income Breakdown ── */}
      <div className="card">
        <h2 className="font-bold text-slate-800 mb-4">📊 Monthly Income Breakdown — {year}</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
          {MONTHS.map((m, i) => {
            const income = monthlyIncome[i];
            const isCurrent = year === CURRENT_YEAR && i === CURRENT_MONTH;
            const isPast = year < CURRENT_YEAR || (year === CURRENT_YEAR && i < CURRENT_MONTH);
            return (
              <div key={m} className={`rounded-xl p-3 text-center border-2 transition-all ${
                isCurrent ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300' :
                income > 0 ? 'border-emerald-400 bg-emerald-50' :
                isPast ? 'border-red-500 bg-red-100' :
                'border-slate-300 bg-slate-50'
              }`}>
                <p className={`text-xs font-bold mb-1 ${isCurrent ? 'text-indigo-600' : isPast && income === 0 ? 'text-red-600' : 'text-slate-500'}`}>{m}</p>
                <p className={`text-xs font-bold ${income > 0 ? 'text-emerald-700' : isPast ? 'text-red-600 font-extrabold' : 'text-slate-300'}`}>
                  {income > 0 ? fmt(income) : isPast ? '₹0' : '—'}
                </p>
              </div>
            );
          })}
        </div>
        {/* Bar chart */}
        <div className="mt-4 flex items-end gap-1 h-16">
          {monthlyIncome.map((v, i) => {
            const max = Math.max(...monthlyIncome, 1);
            const h = Math.round((v / max) * 100);
            const isCurrent = year === CURRENT_YEAR && i === CURRENT_MONTH;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full" title={`${MONTHS[i]}: ${fmt(v)}`}>
                <div
                  className={`w-full rounded-t-md transition-all ${isCurrent ? 'bg-indigo-400' : v > 0 ? 'bg-emerald-400' : 'bg-slate-100'}`}
                  style={{ height: `${Math.max(h, v > 0 ? 8 : 2)}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          {MONTHS.map((m, i) => (
            <span key={m} className={`flex-1 text-center text-[9px] font-semibold ${
              year === CURRENT_YEAR && i === CURRENT_MONTH ? 'text-indigo-500' : 'text-slate-300'
            }`}>{m[0]}</span>
          ))}
        </div>
      </div>

      {/* ── Section 3: Spreadsheet Grid ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800">📋 Payment Grid — {year}</h2>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 rounded-full">✅ Paid</span>
            <span className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-500 px-2 py-1 rounded-full">⚠️ Due</span>
            <span className="flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-400 px-2 py-1 rounded-full">— Closed</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : summary.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-slate-500 font-semibold">No data for {year}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#e2e8f0' }}>
                  <th style={{ border: '1.5px solid #94a3b8', padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#475569', position: 'sticky', left: 0, background: '#cbd5e1', zIndex: 20, minWidth: '150px', whiteSpace: 'nowrap' }}>
                    Tenant
                  </th>
                  {MONTHS.map((m, i) => {
                    const isCurrent = year === CURRENT_YEAR && i === CURRENT_MONTH;
                    return (
                      <th key={m} style={{
                        border: '1.5px solid #94a3b8',
                        padding: '8px 6px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: isCurrent ? '#4f46e5' : '#475569',
                        background: isCurrent ? '#c7d2fe' : '#e2e8f0',
                        minWidth: '70px',
                        whiteSpace: 'nowrap',
                      }}>
                        {m}
                        {isCurrent && <div style={{ fontSize: '9px', color: '#6366f1', fontWeight: 600 }}>▼ now</div>}
                      </th>
                    );
                  })}
                  <th style={{ border: '1.5px solid #94a3b8', padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#475569', background: '#cbd5e1', minWidth: '90px', whiteSpace: 'nowrap' }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.map((t, rowIdx) => {
                  const rowTotal = MONTHS.reduce((s, _, i) => s + cellAmount(t.renter._id, i), 0);
                  const isEven = rowIdx % 2 === 0;
                  return (
                    <tr key={t.renter._id} style={{ background: isEven ? '#ffffff' : '#f8fafc' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseLeave={e => e.currentTarget.style.background = isEven ? '#ffffff' : '#f8fafc'}
                    >
                      {/* Tenant name cell */}
                      <td style={{
                        border: '1.5px solid #94a3b8',
                        padding: '7px 12px',
                        fontWeight: 600,
                        color: '#334155',
                        position: 'sticky',
                        left: 0,
                        background: isEven ? '#ffffff' : '#f8fafc',
                        zIndex: 10,
                        whiteSpace: 'nowrap',
                        borderRight: '2.5px solid #64748b',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '26px', height: '26px', borderRadius: '8px',
                            background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '10px', fontWeight: 700, color: '#7c3aed', flexShrink: 0,
                          }}>
                            {t.renter.name.slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 700 }}>{t.renter.name}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Room {t.renter.roomNumber}</div>
                          </div>
                        </div>
                      </td>

                      {/* Month cells */}
                      {MONTHS.map((_, i) => {
                        const st = cellStatus(t.renter._id, i);
                        const amt = cellAmount(t.renter._id, i);
                        const isCurrent = year === CURRENT_YEAR && i === CURRENT_MONTH;
                        let bg = isCurrent ? '#eef2ff' : 'transparent';
                        let content, textColor;
                        if (st === 'paid') {
                          bg = isCurrent ? '#d1fae5' : '#f0fdf4';
                          textColor = '#15803d';
                          content = (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                              <span style={{ fontSize: '13px' }}>✅</span>
                              <span style={{ fontSize: '9px', fontWeight: 700, color: '#15803d' }}>{fmt(amt)}</span>
                            </div>
                          );
                        } else if (st === 'unpaid') {
                          bg = isCurrent ? '#fca5a5' : '#fee2e2';
                          content = (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                              <span style={{ fontSize: '13px' }}>⚠️</span>
                              <span style={{ fontSize: '9px', fontWeight: 800, color: '#b91c1c' }}>Due</span>
                            </div>
                          );
                        } else {
                          content = <span style={{ color: '#cbd5e1', fontSize: '11px' }}>—</span>;
                        }
                        return (
                          <td key={i} style={{
                            border: '1.5px solid #94a3b8',
                            padding: '6px 4px',
                            textAlign: 'center',
                            background: bg,
                            verticalAlign: 'middle',
                            borderLeft: st === 'unpaid' ? '3px solid #dc2626' : '1.5px solid #94a3b8',
                          }}>
                            {content}
                          </td>
                        );
                      })}

                      {/* Row total */}
                      <td style={{
                        border: '1.5px solid #94a3b8',
                        borderLeft: '2.5px solid #64748b',
                        padding: '7px 10px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: rowTotal > 0 ? '#15803d' : '#94a3b8',
                        background: isEven ? '#f0fdf4' : '#ecfdf5',
                        whiteSpace: 'nowrap',
                      }}>
                        {rowTotal > 0 ? fmt(rowTotal) : '—'}
                      </td>
                    </tr>
                  );
                })}

                {/* Monthly totals row */}
                <tr style={{ background: '#f1f5f9', borderTop: '2px solid #94a3b8' }}>
                  <td style={{
                    border: '1.5px solid #94a3b8',
                    padding: '8px 12px',
                    fontWeight: 700,
                    color: '#334155',
                    position: 'sticky',
                    left: 0,
                    background: '#cbd5e1',
                    zIndex: 10,
                    borderRight: '2.5px solid #64748b',
                    fontSize: '11px',
                  }}>
                    📊 Monthly Total
                  </td>
                  {monthlyIncome.map((v, i) => {
                    const isCurrent = year === CURRENT_YEAR && i === CURRENT_MONTH;
                    return (
                      <td key={i} style={{
                        border: '1.5px solid #94a3b8',
                        padding: '8px 4px',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '11px',
                        color: v > 0 ? '#15803d' : '#94a3b8',
                        background: isCurrent ? '#c7d2fe' : '#e2e8f0',
                      }}>
                        {v > 0 ? fmt(v) : '—'}
                      </td>
                    );
                  })}
                  <td style={{
                    border: '1.5px solid #94a3b8',
                    borderLeft: '2.5px solid #64748b',
                    padding: '8px 10px',
                    textAlign: 'right',
                    fontWeight: 800,
                    fontSize: '13px',
                    color: '#15803d',
                    background: '#dcfce7',
                  }}>
                    {fmt(annualTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Section 4: Individual Contributions ── */}
      <div className="card">
        <h2 className="font-bold text-slate-800 mb-4">👤 Individual Contributions — {year}</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {summary.sort((a, b) => b.totalPaid - a.totalPaid).map((t) => {
              const paidMonths = MONTHS.filter((_, i) => cellStatus(t.renter._id, i) === 'paid');
              const pct = Math.round((t.monthsPaid / 12) * 100);
              return (
                <div key={t.renter._id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 rounded-2xl p-4 border-2 border-slate-300">
                  <div className="flex items-center gap-3 min-w-[160px]">
                    <div className="w-9 h-9 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-xl flex items-center justify-center text-xs font-bold text-violet-600 flex-shrink-0">
                      {t.renter.name.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{t.renter.name}</p>
                      <p className="text-xs text-slate-400">Room {t.renter.roomNumber}</p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{t.monthsPaid} of 12 months paid</span>
                      <span className="font-bold text-emerald-700">{fmt(t.totalPaid)}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    {paidMonths.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {paidMonths.map(m => (
                          <span key={m} className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">{m}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                      t.monthsPending === 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'
                    }`}>
                      {t.monthsPending === 0 ? '✅ All Paid' : `${t.monthsPending} due`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
