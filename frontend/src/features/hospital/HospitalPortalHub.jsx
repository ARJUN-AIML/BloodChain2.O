import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HospitalApprovalDesk } from './HospitalApprovalDesk';
import { HospitalLogisticsDashboard } from './HospitalLogisticsDashboard';
import { AIDemandForecastSection } from '../../components/AIDemandForecastSection';
import { WorkflowGuide } from '../../components/WorkflowGuide';
import { FacilityCampManagement } from '../camps/FacilityCampManagement';
import { CheckSquare, Truck, Building2, TrendingUp, MapPin } from 'lucide-react';

export const HospitalPortalHub = () => {
  const { role, facility } = useAuth();
  
  // Default desk based on user persona, allowing quick desk toggling for full admin workflows
  const [activeWorkspace, setActiveWorkspace] = useState(
    role === 'HOSPITAL_LOGISTICS' ? 'logistics' : 'approval'
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Workspace Control Subheader */}
      <div className="bg-[#dbcfb9]/95 backdrop-blur-md border-b border-[#cbbba1] px-4 sm:px-8 py-3 sticky top-14 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <Building2 className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-bold text-stone-900">{facility?.name}</span>
            <span className="font-mono text-stone-500 text-[11px]">({facility?.facility_id})</span>
            <span className="text-stone-400">&bull;</span>
            <span className="text-stone-700 font-medium">District {facility?.district || 'Madurai'}</span>
            <span className="text-stone-400">&bull;</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-200 text-stone-800 border border-stone-300">
              {facility?.facility_type || 'HOSPITAL'}
            </span>
          </div>

          <div className="flex items-center p-1 rounded-lg bg-stone-200/70 border border-stone-300 overflow-x-auto" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeWorkspace === 'approval'}
              onClick={() => setActiveWorkspace('approval')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeWorkspace === 'approval'
                  ? 'bg-white text-stone-900 border border-stone-300 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Clinical Approval Desk</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeWorkspace === 'logistics'}
              onClick={() => setActiveWorkspace('logistics')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeWorkspace === 'logistics'
                  ? 'bg-white text-stone-900 border border-stone-300 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-teal-600" />
              <span>Logistics & Cold-Chain Desk</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeWorkspace === 'camps'}
              onClick={() => setActiveWorkspace('camps')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeWorkspace === 'camps'
                  ? 'bg-white text-stone-900 border border-stone-300 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span>Donation Camps & Reception</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeWorkspace === 'forecast'}
              onClick={() => setActiveWorkspace('forecast')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeWorkspace === 'forecast'
                  ? 'bg-white text-stone-900 border border-stone-300 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
              <span>AI Demand Forecast</span>
            </button>
          </div>

        </div>
      </div>

      {/* Protocol SOP Stepper (for approval & logistics workspaces) */}
      {(activeWorkspace === 'approval' || activeWorkspace === 'logistics') && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <WorkflowGuide
            activeStep={activeWorkspace === 'approval' ? 2 : 4}
          />
        </div>
      )}

      {/* Render Active Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeWorkspace === 'approval' ? (
          <HospitalApprovalDesk onNavigateToForecast={() => setActiveWorkspace('forecast')} />
        ) : activeWorkspace === 'logistics' ? (
          <HospitalLogisticsDashboard onNavigateToForecast={() => setActiveWorkspace('forecast')} />
        ) : activeWorkspace === 'camps' ? (
          <FacilityCampManagement facility={facility} />
        ) : (
          <AIDemandForecastSection facility={facility} role={role || 'HOSPITAL'} />
        )}
      </div>

    </div>
  );
};

export default HospitalPortalHub;
