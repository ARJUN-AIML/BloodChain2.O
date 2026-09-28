import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/StatCard';
import { WorkflowGuide } from '../../components/WorkflowGuide';
import {
  Building2, Droplet, Inbox, ArrowUpRight, ArrowDownLeft,
  AlertTriangle, CheckCircle2, KeyRound, TrendingUp, History, RefreshCw, AlertCircle,
  X, ShieldCheck, Copy, Lock, Clock
} from 'lucide-react';

export const BloodBankDashboard = () => {
  const { facility } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // State
  const [inventory, setInventory] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState(null);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [incomingTransfers, setIncomingTransfers] = useState([]);
  const [outgoingTransfers, setOutgoingTransfers] = useState([]);
  const [demandData, setDemandData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [timeframe, setTimeframe] = useState('7-day');

  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Modals
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [offerQuantity, setOfferQuantity] = useState(5);

  const [otpModalData, setOtpModalData] = useState(null);
  const [showEnterOtpModal, setShowEnterOtpModal] = useState(false);
  const [selectedTransferForOtp, setSelectedTransferForOtp] = useState(null);
  const [otpInput, setOtpInput] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setActionError('');
    try {
      const [invRes, expRes, recvRes, incRes, outRes, demRes, audRes] = await Promise.all([
        api.get('/inventory/').catch(() => ({ data: [] })),
        api.get('/inventory/expiry-alerts/').catch(() => ({ data: { total_units_tracked: 0, critical_count: 0, warning_count: 0, expiring_units: [] } })),
        api.get('/requests/received/').catch(() => ({ data: [] })),
        api.get('/transfers/incoming/').catch(() => ({ data: [] })),
        api.get('/transfers/outgoing/').catch(() => ({ data: [] })),
        api.get(`/demand/?timeframe=${timeframe}`).catch(() => ({ data: null })),
        api.get('/audit/').catch(() => ({ data: [] }))
      ]);

      setInventory(invRes.data || []);
      setExpiryAlerts(expRes.data || null);
      setReceivedRequests(recvRes.data || []);
      setIncomingTransfers(incRes.data || []);
      setOutgoingTransfers(outRes.data || []);
      setDemandData(demRes.data || null);
      setAuditLogs(audRes.data || []);
    } catch (err) {
      console.error('Failed to load blood bank dashboard data:', err);
      setActionError(err.response?.data?.detail || 'Error loading blood bank data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  const handleRespondRequest = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.post(`/requests/${selectedRequest.id}/respond/`, {
        offered_quantity: parseInt(offerQuantity)
      });
      setActionSuccess(`Allocated ${res.data.allocation.accepted_quantity} units for ${selectedRequest.requesting_facility_name}. Outbound transfer generated.`);
      setShowRespondModal(false);
      setSelectedRequest(null);
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to accept request allocation.');
    }
  };

  const handleApproveTransfer = async (transferId) => {
    setActionError('');
    setActionSuccess('');
    try {
      await api.post(`/transfers/${transferId}/approve/`);
      setActionSuccess('Transfer authorized. Blood units committed in central reserve.');
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to approve transfer.');
    }
  };

  const handleDispatchTransfer = async (transferId) => {
    setActionError('');
    setActionSuccess('');
    try {
      await api.post(`/transfers/${transferId}/dispatch/`);
      setActionSuccess('Shipment dispatched. Moved reserved units to In-Transit with Cold-Chain telemetry.');
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to dispatch transfer.');
    }
  };

  const handleGenerateOTP = async (transfer) => {
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.post(`/transfers/${transfer.id}/generate-otp/`);
      setOtpModalData({ transfer, otp_code: res.data.otp_code });
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to generate Handshake PIN.');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!selectedTransferForOtp) return;
    setActionError('');
    setActionSuccess('');
    try {
      await api.post(`/transfers/${selectedTransferForOtp.id}/verify-otp/`, {
        otp_code: otpInput
      });
      setActionSuccess('Handshake PIN verified. Transfer completed and inventory balance updated atomically.');
      setShowEnterOtpModal(false);
      setSelectedTransferForOtp(null);
      setOtpInput('');
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Invalid Handshake PIN code.');
    }
  };

  const totalAvailableStock = inventory.reduce((acc, curr) => acc + (curr.available_units || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 5-Phase Transfer Protocol Stepper */}
      <WorkflowGuide activeStep={2} />

      {/* Top Banner */}
      <div className="clinical-card p-6 border-slate-800 bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-500 font-semibold text-xs uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Regional Blood Component & Testing Center &bull; Operational Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {facility?.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Facility ID: <span className="text-slate-200 font-semibold">{facility?.facility_id}</span> &bull; Regional Repository TN-BB-01
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2d1b14]" />
            <span>Central Stock: <strong className="text-[#2d1b14] font-mono">{totalAvailableStock}</strong> Units</span>
          </div>

          <button
            type="button"
            onClick={fetchData}
            title="Refresh repository state"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-slate-200' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-xs font-semibold text-red-400 hover:text-red-200 cursor-pointer">Dismiss</button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 rounded-lg bg-[#ede5d5] border border-[#c4b59f] text-[#2d1b14] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2d1b14] flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-xs font-semibold text-[#2d1b14] hover:text-[#5a3825] cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard
          title="Total Blood Stock"
          value={`${totalAvailableStock}`}
          subtext="Central supply inventory"
          icon={Droplet}
          color="emerald"
          badge="AVAILABLE"
        />
        <StatCard
          title="Hospital Requisitions"
          value={receivedRequests.length}
          subtext="Open hospital supply orders"
          icon={Inbox}
          color="indigo"
          badge="INBOUND"
        />
        <StatCard
          title="Active Dispatches"
          value={outgoingTransfers.filter(t => t.status !== 'COMPLETED').length}
          subtext="Shipments in preparation/transit"
          icon={ArrowUpRight}
          color="amber"
          badge="OUTBOUND"
        />
        <StatCard
          title="Completed Deliveries"
          value={outgoingTransfers.filter(t => t.status === 'COMPLETED').length}
          subtext="Fulfilled and verified transfers"
          icon={CheckCircle2}
          color="red"
          badge="SETTLED"
        />
      </div>

      {/* Segmented Tab Navigation */}
      <div className="flex items-center p-1 rounded-lg bg-stone-200/70 border border-stone-300 overflow-x-auto" role="tablist">
        {[
          { id: 'overview', label: 'Central Inventory & Testing' },
          { id: 'requests', label: `Hospital Requests Received (${receivedRequests.length})` },
          { id: 'transfers', label: `Transfers & OTP Verification (${outgoingTransfers.length + incomingTransfers.length})` },
          { id: 'demand', label: 'Regional Demand Projections' },
          { id: 'audit', label: 'Facility Audit Log' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-stone-900 border border-stone-300 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: CENTRAL INVENTORY */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="clinical-card p-6 border-slate-800 bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Droplet className="w-4 h-4 text-[#2d1b14]" />
                <span>Central Blood Component Inventory Breakdown</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">ISBT-128 Compliance Standards</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {inventory.map((inv) => (
                <div key={inv.id} className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl font-bold text-white font-mono">{inv.blood_group}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-stone-800 rounded border border-slate-700">
                        {inv.blood_component || 'RBC'}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${
                      inv.available_units < 10 
                        ? 'bg-[#f7ede0] text-[#3d2212] border-[#d8c2aa]' 
                        : 'bg-[#ede5d5] text-[#2d1b14] border-[#c4b59f]'
                    }`}>
                      {inv.available_units < 10 ? 'Buffer Warning' : 'Optimal Reserve'}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Available:</span> 
                      <strong className="text-[#2d1b14] font-mono">{inv.available_units} units</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Reserved:</span> 
                      <span className="text-[#3c2415] font-mono">{inv.reserved_units} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span>In Transit:</span> 
                      <strong className="text-[#2d1b14] font-mono">{inv.in_transit_units} units</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expiry Risk Alerts */}
          {expiryAlerts && (
            <div className="clinical-card p-6 border-slate-800 bg-slate-900 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#3c2415]" />
                  <span>Cold Storage Expiry Risk Management</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">Continuous Batch Inspection</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-[#f8efe3] border border-[#d2bea6] flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#3c2415] font-semibold">Critical Expiry Window (&le; 7 Days)</div>
                    <div className="text-xl font-bold font-mono text-white mt-0.5">{expiryAlerts.expiring_soon_count || 0} Batches</div>
                  </div>
                  <span className="text-[10px] text-[#3c2415] font-mono">FIFO Prioritization</span>
                </div>
                
                <div className="p-3.5 rounded-lg bg-red-950/30 border border-red-900/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-red-300 font-medium">Quarantined / Expired Units</div>
                    <div className="text-xl font-bold font-mono text-white mt-0.5">{expiryAlerts.expired_count || 0} Batches</div>
                  </div>
                  <span className="text-[10px] text-red-400 font-mono">Disposal Protocol</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REQUESTS RECEIVED */}
      {activeTab === 'requests' && (
        <div className="clinical-card border-slate-800 bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Inbox className="w-4 h-4 text-[#2d1b14]" />
              <span>Inbound Hospital Requisitions</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Open Orders: {receivedRequests.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Requesting Hospital</th>
                  <th className="py-3 px-4">Blood Group</th>
                  <th className="py-3 px-4">Remaining Needed</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4 text-right">Supply Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {receivedRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      No open hospital requisitions currently pending fulfillment.
                    </td>
                  </tr>
                ) : (
                  receivedRequests.map((req) => (
                    <tr key={req.id} className="clinical-table-row">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-200">{req.request_id}</td>
                      <td className="py-3 px-4 font-medium text-slate-100">{req.requesting_facility_name}</td>
                      <td className="py-3 px-4 font-mono text-sm">
                        <span className="font-bold text-red-400">{req.blood_group}</span>
                        <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                          {req.blood_component || 'RBC'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#3c2415] font-mono">{req.remaining_quantity} units</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          req.priority === 'CRITICAL' 
                            ? 'bg-red-950/60 text-red-300 border-red-800' 
                            : 'bg-[#f7ede0] text-[#3d2212] border-[#d8c2aa]'
                        }`}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(req);
                            setOfferQuantity(Math.min(10, req.remaining_quantity));
                            setShowRespondModal(true);
                          }}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold rounded-md text-xs transition-colors cursor-pointer"
                        >
                          Fulfill Quantity
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSFERS & OTP */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <div className="clinical-card border-slate-800 bg-slate-900 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-[#3c2415]" />
                <span>Outbound Hospital Blood Transfers & Dock Handshakes</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">Active Outbound: {outgoingTransfers.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Transfer ID</th>
                    <th className="py-3 px-4">Hospital Receiver</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Supply Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {outgoingTransfers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">
                        No outgoing transfers recorded.
                      </td>
                    </tr>
                  ) : (
                    outgoingTransfers.map((tr) => (
                      <tr key={tr.id} className="clinical-table-row">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-200">{tr.transfer_id}</td>
                        <td className="py-3 px-4 text-slate-100 font-medium">{tr.receiver_facility_name}</td>
                        <td className="py-3 px-4 font-mono text-sm">
                          <span className="font-bold text-red-400">{tr.blood_group}</span>
                          <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                            {tr.blood_component || 'RBC'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold">{tr.quantity} units</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                            tr.status === 'COMPLETED' 
                              ? 'bg-[#ede5d5] text-[#2d1b14] border-[#c4b59f]' 
                              : 'bg-[#f7ede0] text-[#3d2212] border-[#d8c2aa]'
                          }`}>
                            {tr.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {tr.status === 'CREATED' && (
                              <button
                                type="button"
                                onClick={() => handleApproveTransfer(tr.id)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold text-xs cursor-pointer"
                              >
                                Approve Reserve
                              </button>
                            )}
                            {tr.status === 'APPROVED' && (
                              <button
                                type="button"
                                onClick={() => handleDispatchTransfer(tr.id)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold text-xs cursor-pointer"
                              >
                                Dispatch
                              </button>
                            )}
                            {(tr.status === 'DISPATCHED' || tr.status === 'OTP_PENDING') && (
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-[#3c2415] font-semibold uppercase tracking-wider">Dispatch PIN:</span>
                                  <span className="px-2 py-0.5 rounded bg-[#f5ede2] border border-[#a88a6d] text-[#3c2415] font-mono font-bold text-xs">
                                    {tr.latest_otp_code || 'Generating...'}
                                  </span>
                                  {tr.latest_otp_code && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(tr.latest_otp_code);
                                        setActionSuccess(`Copied Dispatch PIN: ${tr.latest_otp_code}`);
                                      }}
                                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                                      title="Copy PIN for Courier Manifest"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  On Manifest &bull; Awaiting Receiver Dock Verification
                                </span>
                              </div>
                            )}
                            {tr.status === 'COMPLETED' && (
                              <span className="text-[#2d1b14] font-semibold text-xs inline-flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Custody Settled &bull; Verified by Receiver</span>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DEMAND PLANNING */}
      {activeTab === 'demand' && demandData && (
        <div className="clinical-card p-6 border-slate-800 bg-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#2d1b14]" />
                <span>Regional Blood Demand Projections & Reserve Modeling</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Predictive models calculate safe surplus quotas for partner hospital transfers.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Projection Horizon:</span>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-white rounded-md px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-slate-600 font-mono"
              >
                <option value="1-day">Next 24 Hours</option>
                <option value="7-day">Next 7 Days</option>
                <option value="30-day">Next 30 Days</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {demandData.predictions.map((p) => (
              <div key={p.blood_group} className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-white font-mono">{p.blood_group}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${
                    p.possible_shortage > 0 
                      ? 'bg-[#f7ede0] text-[#3d2212] border-[#d8c2aa]' 
                      : 'bg-[#ede5d5] text-[#2d1b14] border-[#c4b59f]'
                  }`}>
                    {p.status_note}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-300">
                  <div className="flex justify-between text-slate-400">
                    <span>Current Inventory:</span> 
                    <strong className="text-white font-mono">{p.current_available_stock} units</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Projected Demand:</span> 
                    <strong className="text-slate-200 font-mono">{p.future_blood_demand} units</strong>
                  </div>
                  <div className="flex justify-between text-[#2d1b14] font-semibold border-t border-slate-800 pt-1.5">
                    <span>Safe to Share:</span> 
                    <span className="font-mono">{p.safe_amount_to_share} units</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="clinical-card border-slate-800 bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <span>Blood Bank Immutable Audit Log</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Immutable Audit Records: {auditLogs.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">
                      No repository audit events logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="clinical-table-row">
                      <td className="py-3 px-4 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-4 text-[#2d1b14]">{log.user_name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-100">{log.action}</td>
                      <td className="py-3 px-4 text-[#3c2415]">{log.object_type} #{log.object_id}</td>
                      <td className="py-3 px-4 text-slate-300">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: RESPOND / FULFILL REQUEST */}
      {showRespondModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="clinical-card-elevated max-w-md w-full p-6 bg-slate-900 border-slate-700 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Fulfill Hospital Requisition</h3>
              <button 
                type="button"
                onClick={() => setShowRespondModal(false)} 
                className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg space-y-1.5 text-xs text-slate-300 border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Requesting Facility:</span>
                <strong className="text-white">{selectedRequest.requesting_facility_name}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Blood Group & Component:</span>
                <div className="flex items-center gap-1.5">
                  <strong className="text-red-400 font-mono">{selectedRequest.blood_group}</strong>
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                    {selectedRequest.blood_component || 'RBC'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Unfulfilled Demand:</span>
                <strong className="text-[#3c2415] font-mono">{selectedRequest.remaining_quantity} units</strong>
              </div>
            </div>

            <form onSubmit={handleRespondRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Quantity to Fulfill (Units) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedRequest.remaining_quantity}
                  value={offerQuantity}
                  onChange={(e) => setOfferQuantity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono focus:ring-2 focus:ring-slate-600 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRespondModal(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 font-semibold text-white rounded-lg text-xs cursor-pointer shadow-sm"
                >
                  Commit Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ENTER OTP */}
      {showEnterOtpModal && selectedTransferForOtp && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="clinical-card-elevated max-w-md w-full p-6 bg-slate-900 border-slate-700 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Verify Handshake PIN</h3>
              <button 
                type="button"
                onClick={() => setShowEnterOtpModal(false)} 
                className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg space-y-1 text-xs text-slate-300 border border-slate-800 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Transfer ID:</span>
                <span className="text-white font-semibold">{selectedTransferForOtp.transfer_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hospital:</span>
                <span className="text-slate-200">{selectedTransferForOtp.receiver_facility_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Batch:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#2d1b14] font-bold">{selectedTransferForOtp.quantity} units {selectedTransferForOtp.blood_group}</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                    {selectedTransferForOtp.blood_component || 'RBC'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#f8efe3] border border-[#d2bea6] rounded-lg flex items-start gap-2.5 text-xs text-[#3c2415]">
              <Lock className="w-4 h-4 text-[#3c2415] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Custody Handshake Security</span>
                <span className="text-[11px] text-[#4a2e18]">
                  Enter the 6-digit Handshake PIN provided on the courier transit manifest to verify authenticity and accept blood into inventory.
                </span>
              </div>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4 text-xs">

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Enter 6-Digit PIN <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="483921"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-center font-mono text-xl tracking-widest text-white rounded-lg p-2.5 focus:ring-2 focus:ring-slate-600 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEnterOtpModal(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 font-semibold text-white rounded-lg text-xs cursor-pointer shadow-sm"
                >
                  Verify PIN & Settle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
