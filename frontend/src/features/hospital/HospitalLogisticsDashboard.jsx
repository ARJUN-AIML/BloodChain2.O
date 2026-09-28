import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/StatCard';
import {
  Truck, ArrowUpRight, ArrowDownLeft, KeyRound, CheckCircle2,
  AlertTriangle, RefreshCw, AlertCircle, History, Package, ShieldCheck
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
        api.get('/inventory/'),
        api.get('/transfers/incoming/'),
        api.get('/transfers/outgoing/'),
        api.get('/audit/')
      ]);

      setInventory(invRes.data);
      setIncomingTransfers(incRes.data);
      setOutgoingTransfers(outRes.data);
      setAuditLogs(audRes.data);
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
      setActionSuccess('Shipment dispatched! Moved reserved stock to In-Transit.');
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
      setActionError(err.response?.data?.detail || 'Failed to generate OTP.');
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
      setActionSuccess('OTP code verified! Transfer COMPLETED and stock updated atomically.');
      setShowEnterOtpModal(false);
      setSelectedTransferForOtp(null);
      setOtpInput('');
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Invalid OTP code.');
    }
  };

  // Logistics Metrics
  const awaitingDispatch = outgoingTransfers.filter(t => t.status === 'APPROVED').length;
  const inTransitOutgoing = outgoingTransfers.filter(t => t.status === 'DISPATCHED' || t.status === 'OTP_PENDING').length;
  const incomingInTransit = incomingTransfers.filter(t => t.status === 'DISPATCHED' || t.status === 'OTP_PENDING').length;
  const completedToday = outgoingTransfers.filter(t => t.status === 'COMPLETED').length + incomingTransfers.filter(t => t.status === 'COMPLETED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 p-6 rounded-3xl border border-emerald-500/20 glass-panel">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" />
            <span>Physical Blood Shipment & Dispatch Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hospital Logistics Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch, track, receive, and complete physical blood shipments for <strong className="text-slate-200">{facility?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-xs text-rose-400 font-bold">Dismiss</button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-xs text-emerald-400 font-bold">Dismiss</button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Awaiting Dispatch"
          value={awaitingDispatch}
          subtext="Approved transfers ready for dispatch"
          icon={Package}
          color="amber"
        />
        <StatCard
          title="In-Transit Outgoing"
          value={inTransitOutgoing}
          subtext="Shipments currently moving out"
          icon={ArrowUpRight}
          color="indigo"
        />
        <StatCard
          title="In-Transit Incoming"
          value={incomingInTransit}
          subtext="Shipments moving to this facility"
          icon={ArrowDownLeft}
          color="teal"
        />
        <StatCard
          title="Movements Completed"
          value={completedToday}
          subtext="Fulfilled blood transfers"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: `Shipments Overview (${awaitingDispatch + inTransitOutgoing + incomingInTransit})` },
          { id: 'dispatch_queue', label: `Awaiting Dispatch (${awaitingDispatch})` },
          { id: 'incoming', label: `Incoming Shipments (${incomingTransfers.length})` },
          { id: 'outgoing', label: `Outgoing Shipments (${outgoingTransfers.length})` },
          { id: 'audit', label: 'Logistics Audit History' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & DISPATCH QUEUE */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Package className="w-5 h-5 text-amber-400" />
              <span>Transfers Approved by Clinical Desk — Ready for Dispatch</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Transfer ID</th>
                    <th className="p-3">Destination Hospital</th>
                    <th className="p-3">Blood Group</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Logistics Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {outgoingTransfers.filter(t => t.status === 'APPROVED').length === 0 ? (
                    <tr><td colSpan="6" className="p-4 text-center text-slate-500">No approved shipments currently waiting for dispatch.</td></tr>
                  ) : (
                    outgoingTransfers.filter(t => t.status === 'APPROVED').map((tr) => (
                      <tr key={tr.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-100">{tr.transfer_id}</td>
                        <td className="p-3 font-medium text-slate-200">{tr.receiver_facility_name}</td>
                        <td className="p-3 font-bold text-rose-400">{tr.blood_group}</td>
                        <td className="p-3">{tr.quantity} units</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                            {tr.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleDispatchTransfer(tr.id)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
                          >
                            Dispatch Shipment
                          </button>
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
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Truck className="w-5 h-5 text-indigo-400" />
            <span>Approved Shipments Awaiting Dispatch</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Transfer ID</th>
                  <th className="p-3">Receiver</th>
                  <th className="p-3">Blood Group</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Dispatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {outgoingTransfers.filter(t => t.status === 'APPROVED').length === 0 ? (
                  <tr><td colSpan="5" className="p-4 text-center text-slate-500">No shipments awaiting dispatch.</td></tr>
                ) : (
                  outgoingTransfers.filter(t => t.status === 'APPROVED').map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-100">{tr.transfer_id}</td>
                      <td className="p-3">{tr.receiver_facility_name}</td>
                      <td className="p-3 font-bold text-rose-400">{tr.blood_group}</td>
                      <td className="p-3">{tr.quantity} units</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDispatchTransfer(tr.id)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
                        >
                          Dispatch Blood
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

      {/* TAB 3: INCOMING SHIPMENTS (RECEIVING WORKFLOW) */}
      {activeTab === 'incoming' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
            <span>Incoming Blood Shipments (Receiving Desk)</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Transfer ID</th>
                  <th className="p-3">Sender Facility</th>
                  <th className="p-3">Blood Group</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Receiving Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {incomingTransfers.length === 0 ? (
                  <tr><td colSpan="6" className="p-4 text-center text-slate-500">No incoming shipments found.</td></tr>
                ) : (
                  incomingTransfers.map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-100">{tr.transfer_id}</td>
                      <td className="p-3 font-medium text-slate-200">{tr.sender_facility_name}</td>
                      <td className="p-3 font-bold text-rose-400">{tr.blood_group}</td>
                      <td className="p-3 font-bold text-slate-100">{tr.quantity} units</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tr.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'}`}>
                          {tr.status}
                        </span>
                      </td>
                      <td className="p-3 space-x-2">
                        {(tr.status === 'DISPATCHED' || tr.status === 'OTP_PENDING') && (
                          <button
                            onClick={() => handleGenerateOTP(tr)}
                            className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center space-x-1"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>{tr.status === 'OTP_PENDING' ? 'Regenerate OTP' : 'Generate Receiving OTP'}</span>
                          </button>
                        )}
                        {tr.status === 'COMPLETED' && (
                          <span className="text-emerald-400 font-bold text-xs">Received & Added to Stock</span>
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

      {/* TAB 4: OUTGOING SHIPMENTS (SENDER VERIFICATION WORKFLOW) */}
      {activeTab === 'outgoing' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <ArrowUpRight className="w-5 h-5 text-indigo-400" />
            <span>Outgoing Blood Shipments & Sender Handshake</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Transfer ID</th>
                  <th className="p-3">Receiver Facility</th>
                  <th className="p-3">Blood Group</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Sender Handshake</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {outgoingTransfers.length === 0 ? (
                  <tr><td colSpan="6" className="p-4 text-center text-slate-500">No outgoing shipments found.</td></tr>
                ) : (
                  outgoingTransfers.map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-100">{tr.transfer_id}</td>
                      <td className="p-3 font-medium text-slate-200">{tr.receiver_facility_name}</td>
                      <td className="p-3 font-bold text-rose-400">{tr.blood_group}</td>
                      <td className="p-3">{tr.quantity} units</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tr.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'}`}>
                          {tr.status}
                        </span>
                      </td>
                      <td className="p-3 space-x-2">
                        {tr.status === 'APPROVED' && (
                          <button
                            onClick={() => handleDispatchTransfer(tr.id)}
                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                          >
                            Dispatch
                          </button>
                        )}
                        {tr.status === 'OTP_PENDING' && (
                          <button
                            onClick={() => {
                              setSelectedTransferForOtp(tr);
                              setShowEnterOtpModal(true);
                            }}
                            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>Enter OTP Code</span>
                          </button>
                        )}
                        {tr.status === 'COMPLETED' && (
                          <span className="text-emerald-400 font-bold text-xs">Completed</span>
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

      {/* TAB 5: LOGISTICS AUDIT */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-slate-400" />
            <span>Hospital Logistics Audit Log</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Object</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {auditLogs.length === 0 ? (
                  <tr><td colSpan="5" className="p-4 text-center text-slate-500">No logistics audit logs found.</td></tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-3 text-emerald-400">{log.user_name}</td>
                      <td className="p-3 font-bold text-slate-100">{log.action}</td>
                      <td className="p-3 text-amber-400">{log.object_type} ({log.object_id})</td>
                      <td className="p-3 text-slate-300">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: OTP DISPLAY (RECEIVER) */}
      {otpModalData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-1">
              <KeyRound className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="font-bold text-lg text-white">Receiving OTP Code Generated</h3>
            <p className="text-xs text-slate-400">
              Provide this 6-digit code to the sending facility logistics representative upon physical delivery.
            </p>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <div className="text-xs text-slate-500 font-mono mb-1">HANDSHAKE VERIFICATION CODE</div>
              <div className="text-4xl font-mono font-extrabold text-teal-400 tracking-widest">{otpModalData.otp_code}</div>
              <div className="text-[11px] text-amber-400 mt-2 font-mono">Expires in 10 minutes (One-Time Use)</div>
            </div>

            <button
              onClick={() => setOtpModalData(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
            >
              Close Window
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: ENTER OTP (SENDER) */}
      {showEnterOtpModal && selectedTransferForOtp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">Verify Handshake OTP Code</h3>
              <button onClick={() => setShowEnterOtpModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl space-y-1 text-xs text-slate-300">
              <div>Transfer ID: <strong className="font-mono text-white">{selectedTransferForOtp.transfer_id}</strong></div>
              <div>Destination: <strong className="text-white">{selectedTransferForOtp.receiver_facility_name}</strong></div>
              <div>Shipment: <strong className="text-emerald-400">{selectedTransferForOtp.quantity} units of {selectedTransferForOtp.blood_group}</strong></div>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Enter 6-Digit OTP Provided by Receiver</label>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="483921"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-center font-mono text-xl tracking-widest text-white rounded-xl p-3 focus:border-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 font-bold text-white rounded-xl text-sm shadow-lg shadow-emerald-900/30"
              >
                Verify OTP & Complete Transfer
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
