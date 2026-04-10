const themes = {
  indigo: {
    bg: 'from-violet-500 to-indigo-600',
    light: 'bg-violet-50',
    text: 'text-violet-600',
    shadow: 'shadow-violet-200',
    border: 'border-violet-100',
  },
  green: {
    bg: 'from-emerald-400 to-teal-500',
    light: 'bg-emerald-50',
    text: 'text-emerald-600',
    shadow: 'shadow-emerald-200',
    border: 'border-emerald-100',
  },
  yellow: {
    bg: 'from-amber-400 to-orange-500',
    light: 'bg-amber-50',
    text: 'text-amber-600',
    shadow: 'shadow-amber-200',
    border: 'border-amber-100',
  },
  blue: {
    bg: 'from-blue-400 to-cyan-500',
    light: 'bg-blue-50',
    text: 'text-blue-600',
    shadow: 'shadow-blue-200',
    border: 'border-blue-100',
  },
};

export default function StatCard({ label, value, icon, color = 'indigo', trend }) {
  const t = themes[color];
  return (
    <div className={`bg-white rounded-2xl border ${t.border} shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 p-6 flex items-center gap-5`}>
      <div className={`w-14 h-14 bg-gradient-to-br ${t.bg} rounded-2xl flex items-center justify-center text-2xl shadow-lg ${t.shadow} flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5 truncate">{value}</p>
        {trend && (
          <p className={`text-xs mt-1 font-medium ${t.text}`}>{trend}</p>
        )}
      </div>
    </div>
  );
}
