import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/StatCard';
import {
  Building2, Droplet, Inbox, ArrowUpRight, ArrowDownLeft,
  AlertTriangle, CheckCircle2, KeyRound, TrendingUp, History, RefreshCw, AlertCircle
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
        api.get('/inventory/'),
        api.get('/inventory/expiry-alerts/'),
        api.get('/requests/received/'),
        api.get('/transfers/incoming/'),
        api.get('/transfers/outgoing/'),
        api.get(`/demand/?timeframe=${timeframe}`),
        api.get('/audit/')
      ]);

      setInventory(invRes.data);
      setExpiryAlerts(expRes.data);
      setReceivedRequests(recvRes.data);
      setIncomingTransfers(incRes.data);
      setOutgoingTransfers(outRes.data);
      setDemandData(demRes.data);
      setAuditLogs(audRes.data);
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
      setActionSuccess(`Accepted ${res.data.allocation.accepted_quantity} units for ${selectedRequest.requesting_facility_name}. Transfer created.`);
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
      setActionSuccess('Transfer approved! Reserved units in stock.');
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
      setActionSuccess('Transfer dispatched! Moved to In-Transit.');
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
      setActionSuccess('OTP verified successfully! Transfer COMPLETED and inventory updated atomically.');
      setShowEnterOtpModal(false);
      setSelectedTransferForOtp(null);
      setOtpInput('');
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Invalid OTP code.');
    }
  };

  const totalAvailableStock = inventory.reduce((acc, curr) => acc + curr.available_units, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 p-6 rounded-3xl border border-emerald-500/20 glass-panel">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Regional Blood Centre Supply Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {facility?.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">Facility ID: {facility?.facility_id} | Type: Regional Blood Bank</p>
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

      {/* Notifications / Feedback */}
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
          title="Total Blood Stock"
          value={`${totalAvailableStock} Units`}
          subtext="Central supply inventory"
          icon={Droplet}
          color="emerald"
        />
        <StatCard
          title="Requests Received"
          value={receivedRequests.length}
          subtext="Hospital supply requests"
          icon={Inbox}
          color="indigo"
        />
        <StatCard
          title="Outbound Dispatches"
          value={outgoingTransfers.filter(t => t.status !== 'COMPLETED').length}
          subtext="Active outbound transfers"
          icon={ArrowUpRight}
          color="amber"
        />
        <StatCard
          title="Completed Transfers"
          value={outgoingTransfers.filter(t => t.status === 'COMPLETED').length}
          subtext="Fulfilled blood transfers"
          icon={CheckCircle2}
          color="rose"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Central Inventory' },
          { id: 'requests', label: `Hospital Requests Received (${receivedRequests.length})` },
          { id: 'transfers', label: `Transfers & OTP (${outgoingTransfers.length + incomingTransfers.length})` },
          { id: 'demand', label: 'Future Blood Demand' },
          { id: 'audit', label: 'Facility Audit Log' },
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

      {/* TAB 1: CENTRAL INVENTORY */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Droplet className="w-5 h-5 text-emerald-400" />
              <span>Blood Bank Stock Breakdown by Group</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {inventory.map((inv) => (
                <div key={inv.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-extrabold text-white">{inv.blood_group}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${inv.available_units < 10 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {inv.available_units < 10 ? 'Moderate' : 'High Reserve'}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-400">
                    <div className="flex justify-between"><span>Available:</span> <strong className="text-slate-100">{inv.available_units} units</strong></div>
                    <div className="flex justify-between"><span>Reserved:</span> <span className="text-amber-400">{inv.reserved_units} units</span></div>
                    <div className="flex justify-between"><span>In Transit:</span> <span className="text-indigo-400">{inv.in_transit_units} units</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expiry Alerts */}
          {expiryAlerts && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Expiry Management Summary</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-xs text-amber-300 font-semibold mb-1">Expiring Soon (Within 7 Days)</div>
                  <div className="text-2xl font-bold text-white">{expiryAlerts.expiring_soon_count} Batches</div>
                </div>
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <div className="text-xs text-rose-300 font-semibold mb-1">Expired (Unusable)</div>
                  <div className="text-2xl font-bold text-white">{expiryAlerts.expired_count} Batches</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REQUESTS RECEIVED ONLY */}
      {activeTab === 'requests' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Inbox className="w-5 h-5 text-emerald-400" />
              <span>Hospital Blood Requests Received</span>
            </h3>
            <span className="text-xs text-slate-400 italic">Blood Banks supply requests from eligible hospitals.</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Request ID</th>
                  <th className="p-3">Hospital</th>
                  <th className="p-3">Blood Group</th>
                  <th className="p-3">Remaining Needed</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Supply Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {receivedRequests.length === 0 ? (
                  <tr><td colSpan="6" className="p-4 text-center text-slate-500">No open hospital requests received.</td></tr>
                ) : (
                  receivedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-100">{req.request_id}</td>
                      <td className="p-3 font-medium text-slate-200">{req.requesting_facility_name}</td>
                      <td className="p-3 font-bold text-rose-400">{req.blood_group}</td>
                      <td className="p-3 font-bold text-amber-400">{req.remaining_quantity} units</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                          {req.priority}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setOfferQuantity(Math.min(10, req.remaining_quantity));
                            setShowRespondModal(true);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
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
          {/* Outgoing Transfers (Blood Bank is Sender) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <ArrowUpRight className="w-5 h-5 text-amber-400" />
              <span>Outbound Hospital Blood Transfers</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Transfer ID</th>
                    <th className="p-3">Hospital Receiver</th>
                    <th className="p-3">Blood Group</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Supply Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {outgoingTransfers.length === 0 ? (
                    <tr><td colSpan="6" className="p-4 text-center text-slate-500">No outgoing transfers found.</td></tr>
                  ) : (
                    outgoingTransfers.map((tr) => (
                      <tr key={tr.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-100">{tr.transfer_id}</td>
                        <td className="p-3 text-slate-200">{tr.receiver_facility_name}</td>
                        <td className="p-3 font-bold text-rose-400">{tr.blood_group}</td>
                        <td className="p-3">{tr.quantity} units</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tr.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'}`}>
                            {tr.status}
                          </span>
                        </td>
                        <td className="p-3 space-x-2">
                          {tr.status === 'CREATED' && (
                            <button
                              onClick={() => handleApproveTransfer(tr.id)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                            >
                              Approve Reserve
                            </button>
                          )}
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
                              <span>Enter OTP</span>
                            </button>
                          )}
                          {tr.status === 'COMPLETED' && (
                            <span className="text-emerald-400 font-semibold text-xs">Completed</span>
                          )}
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

      {/* TAB 4: FUTURE BLOOD DEMAND */}
      {activeTab === 'demand' && demandData && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Future Regional Demand & Supply Planning</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                  Simulation Interface
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-semibold">Forecast Horizon:</span>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="1-day">Next 1 Day</option>
                <option value="7-day">Next 7 Days</option>
                <option value="30-day">Next 30 Days</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {demandData.predictions.map((p) => (
              <div key={p.blood_group} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-extrabold text-white">{p.blood_group}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${p.possible_shortage > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {p.status_note}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-300">
                  <div className="flex justify-between"><span>Current Stock:</span> <strong>{p.current_available_stock} units</strong></div>
                  <div className="flex justify-between"><span>Future Demand:</span> <strong className="text-emerald-400">{p.future_blood_demand} units</strong></div>
                  <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1">
                    <span>Safe Amount to Share:</span> <span>{p.safe_amount_to_share} units</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-slate-400" />
            <span>Blood Bank Immutable Audit Log</span>
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
                  <tr><td colSpan="5" className="p-4 text-center text-slate-500">No audit logs found.</td></tr>
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

      {/* MODAL 1: RESPOND / FULFILL REQUEST */}
      {showRespondModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">Fulfill Hospital Request</h3>
              <button onClick={() => setShowRespondModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl space-y-1 text-xs text-slate-300">
              <div>Requesting Hospital: <strong className="text-white">{selectedRequest.requesting_facility_name}</strong></div>
              <div>Blood Group: <strong className="text-rose-400">{selectedRequest.blood_group}</strong></div>
              <div>Remaining Needed: <strong className="text-amber-400">{selectedRequest.remaining_quantity} units</strong></div>
            </div>

            <form onSubmit={handleRespondRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Quantity to Fulfill</label>
                <input
                  type="number"
                  min="1"
                  max={selectedRequest.remaining_quantity}
                  value={offerQuantity}
                  onChange={(e) => setOfferQuantity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-xl text-sm"
              >
                Fulfill Request & Generate Transfer
              </button>
            </form>
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
              <div>Hospital Receiver: <strong className="text-white">{selectedTransferForOtp.receiver_facility_name}</strong></div>
              <div>Quantity: <strong className="text-emerald-400">{selectedTransferForOtp.quantity} {selectedTransferForOtp.blood_group}</strong></div>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Enter 6-Digit OTP from Hospital</label>
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
