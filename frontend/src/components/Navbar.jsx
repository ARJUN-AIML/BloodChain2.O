import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Building2, LogOut, ShieldCheck, RefreshCw, UserCheck, CheckSquare, Truck } from 'lucide-react';

export const Navbar = () => {
  const { profile, facility, role, logout, loginWithDevToken } = useAuth();
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const testAccounts = [
    { label: 'Hospital A (Full Admin Portal)', token: 'dev-token-hosp-001', role: 'HOSPITAL', id: 'HOSP_TN_001' },
    { label: 'Hospital A — Approval Desk User', token: 'dev-token-hosp-001-appr', role: 'HOSPITAL_APPROVAL', id: 'HOSP_TN_001' },
    { label: 'Hospital A — Logistics Officer', token: 'dev-token-hosp-001-log', role: 'HOSPITAL_LOGISTICS', id: 'HOSP_TN_001' },
    { label: 'Hospital B — Approval Desk User', token: 'dev-token-hosp-002-appr', role: 'HOSPITAL_APPROVAL', id: 'HOSP_TN_002' },
    { label: 'Hospital B — Logistics Officer', token: 'dev-token-hosp-002-log', role: 'HOSPITAL_LOGISTICS', id: 'HOSP_TN_002' },
    { label: 'Blood Bank A (Rotary Centre)', token: 'dev-token-bb-001', role: 'BLOOD_BANK', id: 'BB_TN_001' },
  ];

  const getRoleBadgeLabel = (r) => {
    if (r === 'HOSPITAL') return 'HOSPITAL PORTAL (ADMIN)';
    if (r === 'HOSPITAL_APPROVAL') return 'HOSPITAL APPROVAL DESK';
    if (r === 'HOSPITAL_LOGISTICS') return 'HOSPITAL LOGISTICS';
    if (r === 'BLOOD_BANK') return 'BLOOD BANK PORTAL';
    return r;
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center shadow-lg shadow-rose-900/30">
            <Activity className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-rose-400 bg-clip-text text-transparent">
                BLOODCHAIN
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">
                Core v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Tamil Nadu Regional Blood Supply Network</p>
          </div>
        </div>

        {/* User / Facility Info & Role Switcher */}
        {profile && (
          <div className="flex items-center space-x-3">
            {/* Role Badge */}
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center space-x-1.5 border ${
                role === 'HOSPITAL_APPROVAL'
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                  : role === 'HOSPITAL_LOGISTICS'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {role === 'HOSPITAL_APPROVAL' ? <CheckSquare className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
              <span>{getRoleBadgeLabel(role)}</span>
            </span>

            {/* Facility Identity Pill */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-medium text-slate-100">{facility?.name}</span>
              <span className="text-slate-400 font-mono">({facility?.facility_id})</span>
            </div>

            {/* Switch Role Quick Button Container */}
            <button
              onClick={() => setShowSwitchModal(true)}
              title="Switch Active Test Facility Role Persona"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition-all flex items-center space-x-2 text-xs font-bold shadow-md"
            >
              <RefreshCw className="w-4 h-4 text-rose-400" />
              <span>Switch Role</span>
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              title="Log out"
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/40 border border-slate-700 hover:border-rose-700/50 text-slate-400 hover:text-rose-300 transition-colors flex items-center space-x-1 text-xs"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Switch Role Container Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-lg text-white">Switch Test Facility Persona</h3>
              </div>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Select an account to test separate Approval Desk vs Logistics Workspaces:
            </p>
            <div className="space-y-2">
              {testAccounts.map((acc) => (
                <button
                  key={acc.token}
                  onClick={async () => {
                    await loginWithDevToken(acc.token);
                    setShowSwitchModal(false);
                  }}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    profile?.firebase_uid === acc.token
                      ? 'bg-rose-950/40 border-rose-500 text-white shadow-lg'
                      : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm">{acc.label}</div>
                    <div className="text-xs text-slate-400 font-mono">{acc.id}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      acc.role.includes('APPROVAL')
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : acc.role.includes('LOGISTICS')
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
