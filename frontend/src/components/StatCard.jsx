import React from 'react';

export const StatCard = ({ title, value, subtext, icon: Icon, color = 'rose' }) => {
  const colorMap = {
    rose: 'border-rose-500/20 bg-rose-500/5 text-rose-400',
    indigo: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
  };

  return (
    <div className={`p-5 rounded-2xl border ${colorMap[color] || colorMap.rose} glass-panel transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && <Icon className="w-5 h-5 opacity-80" />}
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{value}</div>
      {subtext && <div className="text-xs text-slate-400 mt-1">{subtext}</div>}
    </div>
  );
};
