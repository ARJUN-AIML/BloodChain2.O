import React from 'react';

export const StatCard = ({ title, value, subtext, icon: Icon, color = 'slate', badge }) => {
  const accentStyles = {
    red: 'text-rose-700 bg-rose-50 border-rose-200',
    teal: 'text-[#2d1b14] bg-[#ede5d5] border-[#c4b59f]',
    emerald: 'text-[#2d1b14] bg-[#ede5d5] border-[#c4b59f]',
    amber: 'text-[#3c2415] bg-[#f7ede0] border-[#d8c2aa]',
    indigo: 'text-indigo-800 bg-indigo-50 border-indigo-200',
    slate: 'text-stone-700 bg-stone-100 border-stone-300'
  };

  const currentAccent = accentStyles[color] || accentStyles.slate;

  return (
    <div className="clinical-card p-4 sm:p-5 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/80 text-stone-700 border border-stone-300">
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

      <div className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight font-mono">
        {value}
      </div>

      {subtext && (
        <div className="text-xs text-stone-600 mt-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
};
