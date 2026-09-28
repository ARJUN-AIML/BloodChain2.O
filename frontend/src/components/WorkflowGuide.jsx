import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  GitCommit,
  ShieldCheck,
  Building2,
  Truck,
  KeyRound
} from 'lucide-react';

export const WorkflowGuide = ({ activeStep = 1 }) => {
  const { role, facility } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const steps = [
    {
      num: 1,
      title: '1. Requisition',
      actor: 'Requesting Hospital',
      desc: 'Clinical Desk enters blood unit requirement with priority level & required date.',
      icon: FileText
    },
    {
      num: 2,
      title: '2. Allocation',
      actor: 'Supplier Facility',
      desc: 'Partner hospital or blood bank reviews pending queue and allocates matching inventory.',
      icon: Building2
    },
    {
      num: 3,
      title: '3. Authorization',
      actor: 'Clinical Medical Officer',
      desc: 'Supplier clinical desk authorizes transfer, automatically reserving stock in ledger.',
      icon: ShieldCheck
    },
    {
      num: 4,
      title: '4. Cold Dispatch',
      actor: 'Logistics Desk',
      desc: 'Cold-chain shipment dispatched with container ID and secure 6-digit Handshake PIN.',
      icon: Truck
    },
    {
      num: 5,
      title: '5. PIN Handshake',
      actor: 'Dock Receiving Desk',
      desc: 'Handshake PIN verified upon dock arrival. Inventory settles atomically into receiving facility.',
      icon: KeyRound
    }
  ];

  return (
    <div className="clinical-card p-4 sm:p-5 border-slate-800 bg-slate-900">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <GitCommit className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-white tracking-tight">
                Decentralized Blood Supply Protocol
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                SOP Protocol 5-TN
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Deterministic 5-phase lifecycle: requisition &rarr; allocation &rarr; clinical approval &rarr; cold transit &rarr; atomic custody settlement.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="self-start sm:self-auto px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>{isOpen ? 'Close Protocol Manual' : 'View Protocol SOP'}</span>
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Stepper Pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-3.5">
        {steps.map((st) => {
          const isCompleted = activeStep > st.num;
          const isCurrent = activeStep === st.num;
          const StepIcon = st.icon;

          return (
            <div
              key={st.num}
              className={`p-3 rounded-lg border transition-colors ${
                isCurrent
                  ? 'bg-slate-800/90 border-slate-600 ring-1 ring-slate-500/50'
                  : isCompleted
                  ? 'bg-slate-950/70 border-emerald-900/60'
                  : 'bg-slate-950/40 border-slate-800/80 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isCurrent
                      ? 'bg-red-700 text-white'
                      : isCompleted
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Phase {st.num}
                </span>

                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                ) : (
                  <Clock className="w-3 h-3 text-slate-600" />
                )}
              </div>

              <div className="font-semibold text-xs text-slate-100 flex items-center gap-1.5 mb-0.5">
                <StepIcon className="w-3 h-3 text-slate-400" />
                <span>{st.title}</span>
              </div>
              <div className="text-[10px] font-medium text-slate-400 mb-1">{st.actor}</div>
              <p className="text-[11px] text-slate-400 leading-snug">{st.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Expandable Protocol SOP */}
      {isOpen && (
        <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-3">
          <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Standard Operating Procedure (SOP) Reference:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-md bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-semibold text-slate-200 text-xs block">1. Requester Facility Actions</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Issue requisition via <strong>Clinical Approval Desk &rarr; Create Blood Request</strong>. When supplier completes dispatch, monitor inbound transport under <strong>Logistics Workspace</strong>.
              </p>
            </div>

            <div className="p-3 rounded-md bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-semibold text-slate-200 text-xs block">2. Supplier Facility Actions</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                In <strong>Review & Allocate</strong>, match blood units. Then in <strong>Transfer Approvals</strong>, click <strong>Authorize Transfer</strong> to commit stock. Switch to <strong>Logistics Desk</strong> to dispatch.
              </p>
            </div>

            <div className="p-3 rounded-md bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-semibold text-slate-200 text-xs block">3. Dual Handshake Execution</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Dispatched shipments hold a 6-digit Handshake PIN. Either party entering the PIN at arrival instantly settles custody and updates inventory.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
