import React from 'react';

export const StatCard = ({ title, value, subtext, icon: Icon, color = 'slate', badge }) => {
  const accentStyles = {
    red: 'text-red-400 bg-red-950/40 border-red-800/60',
    teal: 'text-teal-400 bg-teal-950/40 border-teal-800/60',
    emerald: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
    amber: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
    indigo: 'text-indigo-400 bg-indigo-950/40 border-indigo-800/60',
    slate: 'text-slate-400 bg-slate-800/60 border-slate-700/60'
  };

  const currentAccent = accentStyles[color] || accentStyles.slate;

  return (
    <div className="clinical-card p-4 sm:p-5 border-slate-800 bg-slate-900 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {badge}
            </span>
          )}
          {Icon && (
            <div className={`p-1.5 rounded-md border ${currentAccent}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
        {value}
      </div>

      {subtext && (
        <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
};
