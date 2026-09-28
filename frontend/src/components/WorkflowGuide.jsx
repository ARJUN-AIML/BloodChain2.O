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
    <div className="clinical-card p-4 sm:p-5">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-300/70">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-700 shadow-2xs">
            <GitCommit className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-stone-900 tracking-tight">
                Decentralized Blood Supply Protocol
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#ede5d5] text-[#2d1b14] border border-[#c4b59f]">
                SOP Protocol 5-TN
              </span>
            </div>
            <p className="text-[11px] text-stone-600">
              Deterministic 5-phase lifecycle: requisition &rarr; allocation &rarr; clinical approval &rarr; cold transit &rarr; atomic custody settlement.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-white/80 hover:bg-white border border-stone-300 text-stone-700 hover:text-stone-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
        >
          <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
          <span>{isOpen ? 'Close Protocol Manual' : 'View Protocol SOP'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
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
              className={`p-3 rounded-xl border transition-colors ${
                isCurrent
                  ? 'bg-white border-rose-400 ring-2 ring-rose-500/20 shadow-sm'
                  : isCompleted
                  ? 'bg-[#ede5d5] border-[#c4b59f]'
                  : 'bg-white/40 border-stone-300/60 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isCurrent
                      ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white'
                      : isCompleted
                      ? 'bg-[#e2d5c1] text-[#2d1b14] border border-[#baa890]'
                      : 'bg-stone-100 text-stone-600 border border-stone-300/80'
                  }`}
                >
                  Phase {st.num}
                </span>

                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2d1b14]" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                ) : (
                  <Clock className="w-3 h-3 text-stone-400" />
                )}
              </div>

              <div className="font-semibold text-xs text-stone-900 flex items-center gap-1.5 mb-0.5">
                <StepIcon className="w-3 h-3 text-stone-500" />
                <span>{st.title}</span>
              </div>
              <div className="text-[10px] font-medium text-stone-500 mb-1">{st.actor}</div>
              <p className="text-[11px] text-stone-600 leading-snug">{st.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Expandable Protocol SOP */}
      {isOpen && (
        <div className="mt-4 p-4 rounded-xl bg-white/80 border border-stone-300 text-xs text-stone-800 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-stone-900 font-semibold text-xs">
            <ShieldCheck className="w-4 h-4 text-[#2d1b14]" />
            <span>Standard Operating Procedure (SOP) Reference:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-[#faf6f0] border border-stone-200 space-y-1">
              <span className="font-semibold text-stone-900 text-xs block">1. Requester Facility Actions</span>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Issue requisition via <strong>Clinical Approval Desk &rarr; Create Blood Request</strong>. When supplier completes dispatch, monitor inbound transport under <strong>Logistics Workspace</strong>.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#faf6f0] border border-stone-200 space-y-1">
              <span className="font-semibold text-stone-900 text-xs block">2. Supplier Facility Actions</span>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                In <strong>Review & Allocate</strong>, match blood units. Then in <strong>Transfer Approvals</strong>, click <strong>Authorize Transfer</strong> to commit stock. Switch to <strong>Logistics Desk</strong> to dispatch.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#faf6f0] border border-stone-200 space-y-1">
              <span className="font-semibold text-stone-900 text-xs block">3. Dual Handshake Execution</span>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Dispatched shipments hold a 6-digit Handshake PIN. Either party entering the PIN at arrival instantly settles custody and updates inventory.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
