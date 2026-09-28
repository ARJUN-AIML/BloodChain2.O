import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HospitalApprovalDesk } from './HospitalApprovalDesk';
import { HospitalLogisticsDashboard } from './HospitalLogisticsDashboard';
import { WorkflowGuide } from '../../components/WorkflowGuide';
import { CheckSquare, Truck, Building2 } from 'lucide-react';

export const HospitalPortalHub = () => {
  const { role, facility } = useAuth();
  
  // Default desk based on user persona, allowing quick desk toggling for full admin workflows
  const [activeWorkspace, setActiveWorkspace] = useState(
    role === 'HOSPITAL_LOGISTICS' ? 'logistics' : 'approval'
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Workspace Control Subheader */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-4 sm:px-8 py-3 sticky top-14 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Building2 className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="font-semibold text-slate-100">{facility?.name}</span>
            <span className="font-mono text-slate-500 text-[11px]">({facility?.facility_id})</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-300 font-medium">District {facility?.district || 'Madurai'}</span>
          </div>

          <div className="flex items-center p-1 rounded-lg bg-slate-950 border border-slate-800" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeWorkspace === 'approval'}
              onClick={() => setActiveWorkspace('approval')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-2 transition-colors cursor-pointer ${
                activeWorkspace === 'approval'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Clinical Approval Desk</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeWorkspace === 'logistics'}
              onClick={() => setActiveWorkspace('logistics')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-2 transition-colors cursor-pointer ${
                activeWorkspace === 'logistics'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-teal-400" />
              <span>Logistics & Cold-Chain Desk</span>
            </button>
          </div>

        </div>
      </div>

      {/* Protocol SOP Stepper */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <WorkflowGuide
          activeStep={activeWorkspace === 'approval' ? 2 : 4}
        />
      </div>

      {/* Render Active Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeWorkspace === 'approval' ? (
          <HospitalApprovalDesk />
        ) : (
          <HospitalLogisticsDashboard />
        )}
      </div>

    </div>
  );
};
