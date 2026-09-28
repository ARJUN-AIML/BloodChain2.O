import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HospitalApprovalDesk } from './HospitalApprovalDesk';
import { HospitalLogisticsDashboard } from './HospitalLogisticsDashboard';
import { CheckSquare, Truck, Building2, ArrowRight } from 'lucide-react';

export const HospitalPortalHub = () => {
  const { profile, role, facility } = useAuth();
  
  // If role is strictly HOSPITAL_APPROVAL, render Approval Desk directly
  if (role === 'HOSPITAL_APPROVAL') {
    return <HospitalApprovalDesk />;
  }

  // If role is strictly HOSPITAL_LOGISTICS, render Logistics Dashboard directly
  if (role === 'HOSPITAL_LOGISTICS') {
    return <HospitalLogisticsDashboard />;
  }

  // If user is HOSPITAL (Admin/Full Workspace), provide workspace selection & tab toggle
  const [activeWorkspace, setActiveWorkspace] = useState('approval');

  return (
    <div className="space-y-6">
      {/* Workspace Switcher Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
            <Building2 className="w-4 h-4 text-rose-500" />
            <span className="text-white">{facility?.name}</span>
            <span className="text-slate-500">| Hospital Workspaces</span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveWorkspace('approval')}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-2 transition-all ${
                activeWorkspace === 'approval'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Approval Desk</span>
            </button>

            <button
              onClick={() => setActiveWorkspace('logistics')}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-2 transition-all ${
                activeWorkspace === 'logistics'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Logistics Workspace</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Active Workspace */}
      {activeWorkspace === 'approval' ? (
        <HospitalApprovalDesk />
      ) : (
        <HospitalLogisticsDashboard />
      )}
    </div>
  );
};
