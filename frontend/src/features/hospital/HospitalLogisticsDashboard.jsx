import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/StatCard';
import {
  Truck, ArrowUpRight, ArrowDownLeft, KeyRound, CheckCircle2,
  AlertTriangle, RefreshCw, AlertCircle, History, Package, ShieldCheck,
  Thermometer, X, Lock, Clock, Copy
} from 'lucide-react';

export const HospitalLogisticsDashboard = () => {
  const { facility } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // State
  const [inventory, setInventory] = useState([]);
  const [incomingTransfers, setIncomingTransfers] = useState([]);
  const [outgoingTransfers, setOutgoingTransfers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Modals
  const [otpModalData, setOtpModalData] = useState(null);
  const [showEnterOtpModal, setShowEnterOtpModal] = useState(false);
  const [selectedTransferForOtp, setSelectedTransferForOtp] = useState(null);
  const [otpInput, setOtpInput] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setActionError('');
    try {
      const [invRes, incRes, outRes, audRes] = await Promise.all([
        api.get('/inventory/').catch(() => ({ data: [] })),
        api.get('/transfers/incoming/').catch(() => ({ data: [] })),
        api.get('/transfers/outgoing/').catch(() => ({ data: [] })),
        api.get('/audit/').catch(() => ({ data: [] }))
      ]);

      setInventory(invRes.data || []);
      setIncomingTransfers(incRes.data || []);
      setOutgoingTransfers(outRes.data || []);
      setAuditLogs(audRes.data || []);
    } catch (err) {
      console.error('Error fetching logistics data:', err);
      setActionError(err.response?.data?.detail || 'Failed to load logistics workspace data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDispatchTransfer = async (transferId) => {
    setActionError('');
    setActionSuccess('');
    try {
      await api.post(`/transfers/${transferId}/dispatch/`);
      setActionSuccess('Shipment dispatched. Units transitioned to In-Transit with Cold-Chain telemetry.');
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to dispatch shipment.');
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
      setActionSuccess('Handshake PIN verified. Physical custody transferred and inventory settled atomically.');
      setShowEnterOtpModal(false);
      setSelectedTransferForOtp(null);
      setOtpInput('');
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Invalid Handshake PIN code.');
    }
  };

  // Logistics Metrics
  const awaitingDispatch = outgoingTransfers.filter(t => t.status === 'APPROVED').length;
  const inTransitOutgoing = outgoingTransfers.filter(t => t.status === 'DISPATCHED' || t.status === 'OTP_PENDING').length;
  const incomingInTransit = incomingTransfers.filter(t => t.status === 'DISPATCHED' || t.status === 'OTP_PENDING').length;
  const completedToday = outgoingTransfers.filter(t => t.status === 'COMPLETED').length + incomingTransfers.filter(t => t.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="clinical-card p-6 border-slate-800 bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" />
            <span>Cold-Chain Logistics & Receiving Dock &bull; Section 6</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Hospital Logistics & Telemetry Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Physical blood dispatch, cold-chain compliance (2°C – 6°C), and Handshake PIN dock verification for <strong className="text-slate-200">{facility?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <Thermometer className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-mono text-[11px] text-teal-300 font-semibold">Cold-Chain: 3.8°C Nominal</span>
          </div>

          <button
            type="button"
            onClick={fetchData}
            title="Refresh logistics status"
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
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-xs font-semibold text-emerald-400 hover:text-emerald-200 cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Logistics Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard
          title="Awaiting Dispatch"
          value={awaitingDispatch}
          subtext="Authorized batches ready at dock"
          icon={Package}
          color="amber"
          badge="DOCK QUEUE"
        />
        <StatCard
          title="Outbound In-Transit"
          value={inTransitOutgoing}
          subtext="Active shipments en-route"
          icon={ArrowUpRight}
          color="indigo"
          badge="OUTBOUND"
        />
        <StatCard
          title="Inbound In-Transit"
          value={incomingInTransit}
          subtext="Expected at receiving dock"
          icon={ArrowDownLeft}
          color="teal"
          badge="INBOUND"
        />
        <StatCard
          title="Settled Deliveries"
          value={completedToday}
          subtext="Verified custody transfers"
          icon={CheckCircle2}
          color="emerald"
          badge="SETTLED"
        />
      </div>

      {/* Segmented Tab Navigation */}
      <div className="flex items-center p-1 rounded-lg bg-slate-950 border border-slate-800 overflow-x-auto" role="tablist">
        {[
          { id: 'overview', label: `Active Dock Overview (${incomingInTransit + inTransitOutgoing})` },
          { id: 'dispatch_queue', label: `Awaiting Dispatch (${awaitingDispatch})` },
          { id: 'incoming', label: `Inbound Receiving Dock (${incomingTransfers.length})` },
          { id: 'outgoing', label: `Outbound Dispatch Dock (${outgoingTransfers.length})` },
          { id: 'audit', label: 'Logistics Custody Trail' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="clinical-card border-slate-800 bg-slate-900 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal-400" />
                <span>Active Cold-Chain Transport Telemetry</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">In-Transit Batches: {incomingInTransit + inTransitOutgoing}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Transfer ID</th>
                    <th className="py-3 px-4">Origin &rarr; Destination</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Units</th>
                    <th className="py-3 px-4">Cold-Chain Temp</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Dock Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[...incomingTransfers, ...outgoingTransfers].filter(t => t.status === 'DISPATCHED' || t.status === 'OTP_PENDING').length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">
                        No blood shipments currently in transit.
                      </td>
                    </tr>
                  ) : (
                    [...incomingTransfers, ...outgoingTransfers]
                      .filter(t => t.status === 'DISPATCHED' || t.status === 'OTP_PENDING')
                      .map((tr) => (
                        <tr key={tr.id} className="clinical-table-row">
                          <td className="py-3 px-4 font-mono font-semibold text-slate-200">{tr.transfer_id}</td>
                          <td className="py-3 px-4">
                            <span className="text-slate-300">{tr.sender_facility_name}</span>
                            <span className="text-slate-500 mx-1.5">&rarr;</span>
                            <span className="font-semibold text-white">{tr.receiver_facility_name}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-sm">
                            <span className="font-bold text-red-400">{tr.blood_group}</span>
                            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                              {tr.blood_component || 'RBC'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold">{tr.quantity} units</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-950/60 border border-teal-800/80 text-teal-300 text-[10px] font-mono font-semibold">
                              <Thermometer className="w-3 h-3 text-teal-400" />
                              3.8°C (Nominal)
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-950/60 text-teal-300 border border-teal-800">
                              IN_TRANSIT
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Dispatch PIN:</span>
                                <span className="px-2 py-0.5 rounded bg-slate-950 border border-amber-600/40 text-amber-300 font-mono font-bold text-xs">
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
                                On Manifest &bull; Awaiting Receiver Verification
                              </span>
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

      {/* TAB 2: AWAITING DISPATCH */}
      {activeTab === 'dispatch_queue' && (
        <div className="clinical-card border-slate-800 bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Approved Outbound Batches Awaiting Physical Dispatch</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Queue Count: {outgoingTransfers.filter(t => t.status === 'APPROVED').length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Transfer ID</th>
                  <th className="py-3 px-4">Destination Hospital</th>
                  <th className="py-3 px-4">Blood Group</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4 text-right">Dock Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {outgoingTransfers.filter(t => t.status === 'APPROVED').length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">
                      No outbound shipments currently awaiting dispatch.
                    </td>
                  </tr>
                ) : (
                  outgoingTransfers.filter(t => t.status === 'APPROVED').map((tr) => (
                    <tr key={tr.id} className="clinical-table-row">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-200">{tr.transfer_id}</td>
                      <td className="py-3 px-4 font-medium text-slate-100">{tr.receiver_facility_name}</td>
                      <td className="py-3 px-4 font-mono text-sm">
                        <span className="font-bold text-red-400">{tr.blood_group}</span>
                        <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                          {tr.blood_component || 'RBC'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold">{tr.quantity} units</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDispatchTransfer(tr.id)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold rounded-md text-xs transition-colors cursor-pointer"
                        >
                          Dispatch Blood Box
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

      {/* TAB 3: INCOMING SHIPMENTS */}
      {activeTab === 'incoming' && (
        <div className="clinical-card border-slate-800 bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-teal-400" />
              <span>Inbound Blood Shipments (Receiving Dock)</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Inbound Records: {incomingTransfers.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Transfer ID</th>
                  <th className="py-3 px-4">Supplier Facility</th>
                  <th className="py-3 px-4">Blood Group</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Dock Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {incomingTransfers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      No inbound blood transfers recorded.
                    </td>
                  </tr>
                ) : (
                  incomingTransfers.map((tr) => (
                    <tr key={tr.id} className="clinical-table-row">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-200">{tr.transfer_id}</td>
                      <td className="py-3 px-4 font-medium text-slate-100">{tr.sender_facility_name}</td>
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
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            : 'bg-teal-950/60 text-teal-300 border-teal-800'
                        }`}>
                          {tr.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(tr.status === 'DISPATCHED' || tr.status === 'OTP_PENDING') && (
                          <div className="flex items-center justify-end gap-2.5">
                            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 font-mono text-[11px] flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-500" />
                              <span>Courier PIN Required</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTransferForOtp(tr);
                                setOtpInput('');
                                setShowEnterOtpModal(true);
                              }}
                              className="px-2.5 py-1 bg-teal-700 hover:bg-teal-600 text-white font-semibold rounded-md text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm Receipt (Enter PIN)</span>
                            </button>
                          </div>
                        )}
                        {tr.status === 'COMPLETED' && (
                          <span className="text-emerald-400 font-semibold text-xs inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Received in Inventory</span>
                          </span>
                        )}
                        {(tr.status === 'CREATED' || tr.status === 'APPROVED') && (
                          <span className="text-slate-500 font-mono text-[11px]">
                            Awaiting Dispatch
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: OUTGOING SHIPMENTS */}
      {activeTab === 'outgoing' && (
        <div className="clinical-card border-slate-800 bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-indigo-400" />
              <span>Outbound Blood Shipments & Dispatch Log</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Outbound Total: {outgoingTransfers.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Transfer ID</th>
                  <th className="py-3 px-4">Destination Facility</th>
                  <th className="py-3 px-4">Blood Group</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Sender Custody</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {outgoingTransfers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      No outbound transfers logged.
                    </td>
                  </tr>
                ) : (
                  outgoingTransfers.map((tr) => (
                    <tr key={tr.id} className="clinical-table-row">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-200">{tr.transfer_id}</td>
                      <td className="py-3 px-4 font-medium text-slate-100">{tr.receiver_facility_name}</td>
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
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            : 'bg-teal-950/60 text-teal-300 border-teal-800'
                        }`}>
                          {tr.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {tr.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleDispatchTransfer(tr.id)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold rounded-md text-xs transition-colors cursor-pointer"
                          >
                            Dispatch Shipment
                          </button>
                        )}
                        {(tr.status === 'DISPATCHED' || tr.status === 'OTP_PENDING') && (
                          <div className="flex items-center justify-end gap-2">
                            {tr.latest_otp_code && (
                              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-200 font-mono font-bold text-xs">
                                PIN: {tr.latest_otp_code}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTransferForOtp(tr);
                                setOtpInput(tr.latest_otp_code || '');
                                setShowEnterOtpModal(true);
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold rounded-md text-xs transition-colors cursor-pointer"
                            >
                              Verify PIN
                            </button>
                          </div>
                        )}
                        {tr.status === 'COMPLETED' && (
                          <span className="text-emerald-400 font-semibold text-xs inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Delivered & Settled</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT */}
      {activeTab === 'audit' && (
        <div className="clinical-card border-slate-800 bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <span>Hospital Logistics Physical Custody Audit Trail</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Immutable Log Entries: {auditLogs.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Logistics Officer</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">
                      No logistics audit records recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="clinical-table-row">
                      <td className="py-3 px-4 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-4 text-teal-400">{log.user_name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-100">{log.action}</td>
                      <td className="py-3 px-4 text-amber-400">{log.object_type} #{log.object_id}</td>
                      <td className="py-3 px-4 text-slate-300">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: OTP DISPLAY */}
      {otpModalData && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="clinical-card-elevated max-w-md w-full p-6 bg-slate-900 border-slate-700 space-y-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-teal-950 border border-teal-800 text-teal-400 flex items-center justify-center mx-auto">
              <KeyRound className="w-5 h-5" />
            </div>
            
            <div>
              <h3 className="font-bold text-base text-white">Dock Handshake PIN Generated</h3>
              <p className="text-xs text-slate-400 mt-1">
                Share this secure 6-digit PIN with the receiving officer at physical handover.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">
                Handshake Verification PIN
              </div>
              <div className="text-3xl font-mono font-bold text-teal-400 tracking-widest">
                {otpModalData.otp_code}
              </div>
              <div className="text-[11px] text-amber-400 mt-1.5 font-mono">
                Single-use cryptographic custody token
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOtpModalData(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs cursor-pointer"
            >
              Close Window
            </button>
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
                <span className="text-slate-500">Facility:</span>
                <span className="text-slate-200">{selectedTransferForOtp.receiver_facility_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Cargo:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-teal-400 font-bold">{selectedTransferForOtp.quantity} units {selectedTransferForOtp.blood_group}</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                    {selectedTransferForOtp.blood_component || 'RBC'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-lg flex items-start gap-2.5 text-xs text-amber-200">
              <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Custody Handshake Security</span>
                <span className="text-[11px] text-amber-300/80">
                  The sender sealed this shipment with a unique custody PIN on the transit manifest. Inspect the cold-chain parcel and enter the 6-digit PIN from the delivery personnel to verify authenticity and accept blood into hospital inventory.
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
                  className="flex-1 py-2 bg-teal-700 hover:bg-teal-600 font-semibold text-white rounded-lg text-xs cursor-pointer shadow-sm"
                >
                  Confirm Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
