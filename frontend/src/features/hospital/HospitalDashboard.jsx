import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/StatCard';
import {
  Activity, Droplet, Send, Inbox, ArrowUpRight, ArrowDownLeft,
  AlertTriangle, CheckCircle2, Clock, Plus, ShieldCheck, KeyRound,
  TrendingUp, History, RefreshCw, AlertCircle, Check
} from 'lucide-react';

export const HospitalDashboard = () => {
  const { facility } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // State
  const [inventory, setInventory] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState(null);
  const [sentRequests, setSentRequests] = useState([]);
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [otpModalData, setOtpModalData] = useState(null); // { transfer, otp_code }
  const [showEnterOtpModal, setShowEnterOtpModal] = useState(false);
  const [selectedTransferForOtp, setSelectedTransferForOtp] = useState(null);
  const [otpInput, setOtpInput] = useState('');

  // Create Request Form State
  const [reqBloodGroup, setReqBloodGroup] = useState('O+');
  const [reqBloodComponent, setReqBloodComponent] = useState('RBC');
  const [reqQuantity, setReqQuantity] = useState(10);
  const [reqPriority, setReqPriority] = useState('HIGH');
  const [reqDate, setReqDate] = useState(new Date().toISOString().split('T')[0]);
  const [reqReason, setReqReason] = useState('Emergency Surgery');

  // Respond Request Form State
  const [offerQuantity, setOfferQuantity] = useState(5);

  const fetchData = async () => {
    setLoading(true);
    setActionError('');
    try {
      const [invRes, expRes, sentRes, recvRes, incRes, outRes, demRes, audRes] = await Promise.all([
        api.get('/inventory/'),
        api.get('/inventory/expiry-alerts/'),
        api.get('/requests/sent/'),
        api.get('/requests/received/'),
        api.get('/transfers/incoming/'),
        api.get('/transfers/outgoing/'),
        api.get(`/demand/?timeframe=${timeframe}`),
        api.get('/audit/')
      ]);

      setInventory(invRes.data);
      setExpiryAlerts(expRes.data);
      setSentRequests(sentRes.data);
      setReceivedRequests(recvRes.data);
      setIncomingTransfers(incRes.data);
      setOutgoingTransfers(outRes.data);
      setDemandData(demRes.data);
      setAuditLogs(audRes.data);
    } catch (err) {
      console.error('Failed to load hospital dashboard data:', err);
      setActionError(err.response?.data?.detail || 'Error loading dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  // Handlers
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    try {
      await api.post('/requests/', {
        blood_group: reqBloodGroup,
        blood_component: reqBloodComponent,
        requested_quantity: parseInt(reqQuantity),
        required_date: reqDate,
        priority: reqPriority,
        reason: reqReason
      });
      setActionSuccess('Blood request created successfully.');
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Failed to create blood request.';
      if (data) {
        if (typeof data === 'string') msg = data;
        else if (data.detail) msg = data.detail;
        else if (typeof data === 'object') {
          msg = Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join(' | ');
        }
      }
      setActionError(msg);
    }
  };

  const handleRespondRequest = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.post(`/requests/${selectedRequest.id}/respond/`, {
        offered_quantity: parseInt(offerQuantity)
      });
      setActionSuccess(`Accepted ${res.data.allocation.accepted_quantity} units. Transfer created.`);
      setShowRespondModal(false);
      setSelectedRequest(null);
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to respond to request.');
    }
  };

  const handleApproveTransfer = async (transferId) => {
    setActionError('');
    setActionSuccess('');
    try {
      await api.post(`/transfers/${transferId}/approve/`);
      setActionSuccess('Transfer approved! Stock reserved.');
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
      const res = await api.post(`/transfers/${selectedTransferForOtp.id}/verify-otp/`, {
        otp_code: otpInput
      });
      setActionSuccess('OTP verified successfully! Transfer COMPLETED and atomic inventory updated.');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-3xl border border-indigo-500/20 glass-panel">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>Hospital Operational Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {facility?.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">Facility ID: {facility?.facility_id} | District: {facility?.district}</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Blood Request</span>
          </button>
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
        <div className="p-4 rounded-2xl bg-[#ede5d5] border border-[#c4b59f] text-[#2d1b14] text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-[#2d1b14] flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-xs text-[#2d1b14] font-bold">Dismiss</button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Current Blood Stock"
          value={`${totalAvailableStock} Units`}
          subtext="Usable available stock"
          icon={Droplet}
          color="rose"
        />
        <StatCard
          title="Requests Sent"
          value={sentRequests.length}
          subtext="Created blood requests"
          icon={Send}
          color="indigo"
        />
        <StatCard
          title="Incoming Transfers"
          value={incomingTransfers.filter(t => t.status !== 'COMPLETED').length}
          subtext="Inbound blood transfers"
          icon={ArrowDownLeft}
          color="emerald"
        />
        <StatCard
          title="Outgoing Transfers"
          value={outgoingTransfers.filter(t => t.status !== 'COMPLETED').length}
          subtext="Outbound blood transfers"
          icon={ArrowUpRight}
          color="amber"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Inventory & Stock' },
          { id: 'requests', label: `Blood Requests (${sentRequests.length + receivedRequests.length})` },
          { id: 'transfers', label: `Transfers & OTP (${incomingTransfers.length + outgoingTransfers.length})` },
          { id: 'demand', label: 'Future Blood Demand' },
          { id: 'audit', label: 'Facility Audit Log' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: INVENTORY & STOCK */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Droplet className="w-5 h-5 text-rose-500" />
              <span>Real-Time Facility Inventory Breakdown</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {inventory.map((inv) => (
                <div key={inv.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl font-extrabold text-white">{inv.blood_group}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-800 text-teal-300 border border-slate-700">
                        {inv.blood_component || 'RBC'}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${inv.available_units < 5 ? 'bg-rose-500/20 text-rose-400' : 'bg-[#ede5d5] text-[#2d1b14]'}`}>
                      {inv.available_units < 5 ? 'Low Stock' : 'Optimal'}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-400">
                    <div className="flex justify-between"><span>Available:</span> <strong className="text-slate-100">{inv.available_units} units</strong></div>
                    <div className="flex justify-between"><span>Reserved:</span> <span className="text-[#3c2415]">{inv.reserved_units} units</span></div>
                    <div className="flex justify-between"><span>In Transit:</span> <strong className="text-[#2d1b14]">{inv.in_transit_units} units</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expiry Alerts */}
          {expiryAlerts && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-[#3c2415]" />
                <span>Expiry Management Alerts</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#f8efe3] border border-[#d2bea6]">
                  <div className="text-xs text-[#3c2415] font-semibold mb-1">Expiring Soon (Within 7 Days)</div>
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

      {/* TAB 2: BLOOD REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          
          {/* Requests Sent */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Send className="w-5 h-5 text-indigo-400" />
                <span>Requests Sent by {facility?.name}</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Request</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Request ID</th>
                    <th className="p-3">Blood Group</th>
                    <th className="p-3">Requested</th>
                    <th className="p-3">Fulfilled</th>
                    <th className="p-3">Required Date</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sentRequests.length === 0 ? (
                    <tr><td colSpan="7" className="p-4 text-center text-slate-500">No requests sent yet.</td></tr>
                  ) : (
                    sentRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-100">{req.request_id}</td>
                        <td className="p-3 font-mono text-sm">
                          <span className="font-bold text-rose-400">{req.blood_group}</span>
                          <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                            {req.blood_component || 'RBC'}
                          </span>
                        </td>
                        <td className="p-3">{req.requested_quantity} units</td>
                        <td className="p-3 text-[#2d1b14] font-bold">{req.fulfilled_quantity} / {req.requested_quantity}</td>
                        <td className="p-3">{req.required_date}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.priority === 'EMERGENCY' ? 'bg-rose-500/20 text-rose-300' : 'bg-[#f7ede0] text-[#3d2212]'}`}>
                            {req.priority}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${req.status === 'FULFILLED' ? 'bg-[#ede5d5] text-[#2d1b14]' : 'bg-slate-800 text-slate-300'}`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Received Requests from Other Facilities */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Inbox className="w-5 h-5 text-[#2d1b14]" />
              <span>Requests Received from Eligible Regional Facilities</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Request ID</th>
                    <th className="p-3">Requesting Facility</th>
                    <th className="p-3">Blood Group</th>
                    <th className="p-3">Remaining Needed</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {receivedRequests.length === 0 ? (
                    <tr><td colSpan="6" className="p-4 text-center text-slate-500">No open incoming request alerts from regional facilities.</td></tr>
                  ) : (
                    receivedRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-100">{req.request_id}</td>
                        <td className="p-3 font-medium text-slate-200">{req.requesting_facility_name}</td>
                        <td className="p-3 font-mono text-sm">
                          <span className="font-bold text-rose-400">{req.blood_group}</span>
                          <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                            {req.blood_component || 'RBC'}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-[#3c2415]">{req.remaining_quantity} units</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f7ede0] text-[#3d2212]">
                            {req.priority}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setOfferQuantity(Math.min(5, req.remaining_quantity));
                              setShowRespondModal(true);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                          >
                            Accept Quantity
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

      {/* TAB 3: TRANSFERS & OTP */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          
          {/* Incoming Transfers (Hospital is Receiver) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <ArrowDownLeft className="w-5 h-5 text-[#2d1b14]" />
              <span>Incoming Blood Transfers (Receiving)</span>
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
                    <th className="p-3">OTP Handshake Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {incomingTransfers.length === 0 ? (
                    <tr><td colSpan="6" className="p-4 text-center text-slate-500">No incoming transfers found.</td></tr>
                  ) : (
                    incomingTransfers.map((tr) => (
                      <tr key={tr.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-100">{tr.transfer_id}</td>
                        <td className="p-3 text-slate-200">{tr.sender_facility_name}</td>
                        <td className="p-3 font-mono text-sm">
                          <span className="font-bold text-rose-400">{tr.blood_group}</span>
                          <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                            {tr.blood_component || 'RBC'}
                          </span>
                        </td>
                        <td className="p-3">{tr.quantity} units</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tr.status === 'COMPLETED' ? 'bg-[#ede5d5] text-[#2d1b14]' : 'bg-indigo-500/20 text-indigo-300'}`}>
                            {tr.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {['DISPATCHED', 'OTP_PENDING'].includes(tr.status) ? (
                            <button
                              onClick={() => handleGenerateOTP(tr)}
                              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Generate OTP</span>
                            </button>
                          ) : (
                            <span className="text-slate-500 italic">
                              {tr.status === 'COMPLETED' ? 'Completed' : 'Awaiting Dispatch'}
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

          {/* Outgoing Transfers (Hospital is Sender) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <ArrowUpRight className="w-5 h-5 text-[#3c2415]" />
              <span>Outgoing Blood Transfers (Sending)</span>
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
                    <th className="p-3">Sender Actions</th>
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
                        <td className="p-3 font-mono text-sm">
                          <span className="font-bold text-rose-400">{tr.blood_group}</span>
                          <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                            {tr.blood_component || 'RBC'}
                          </span>
                        </td>
                        <td className="p-3">{tr.quantity} units</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tr.status === 'COMPLETED' ? 'bg-[#ede5d5] text-[#2d1b14]' : 'bg-[#f7ede0] text-[#3d2212]'}`}>
                            {tr.status}
                          </span>
                        </td>
                        <td className="p-3 space-x-2">
                          {tr.status === 'CREATED' && (
                            <button
                              onClick={() => handleApproveTransfer(tr.id)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                            >
                              Approve
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
                            <span className="text-[#2d1b14] font-semibold text-xs">Completed</span>
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
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Future Blood Demand Forecast</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#f7ede0] text-[#3d2212] border border-[#d8c2aa] rounded">
                  Simulation Interface
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Demand estimation interface. Architecturally ready for real ML model integration.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-semibold">Forecast Horizon:</span>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-rose-500"
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
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${p.possible_shortage > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-[#ede5d5] text-[#2d1b14]'}`}>
                    {p.status_note}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-300">
                  <div className="flex justify-between"><span>Current Available:</span> <strong>{p.current_available_stock} units</strong></div>
                  <div className="flex justify-between"><span>Future Demand:</span> <strong className="text-indigo-400">{p.future_blood_demand} units</strong></div>
                  <div className="flex justify-between"><span>Safety Reserve:</span> <span>{p.safety_reserve} units</span></div>
                  <div className="flex justify-between border-t border-slate-800 pt-1 text-rose-400 font-bold">
                    <span>Possible Shortage:</span> <span>{p.possible_shortage} units</span>
                  </div>
                  <div className="flex justify-between text-[#2d1b14] font-bold">
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
            <span>Facility Immutable Audit History</span>
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
                      <td className="p-3 text-indigo-400">{log.user_name}</td>
                      <td className="p-3 font-bold text-slate-100">{log.action}</td>
                      <td className="p-3 text-[#3c2415]">{log.object_type} ({log.object_id})</td>
                      <td className="p-3 text-slate-300">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE BLOOD REQUEST */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">Create Blood Request</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Blood Group Needed</label>
                <select
                  value={reqBloodGroup}
                  onChange={(e) => setReqBloodGroup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Blood Component</label>
                <select
                  value={reqBloodComponent}
                  onChange={(e) => setReqBloodComponent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5"
                >
                  <option value="RBC">RBC (Red Blood Cells / PRBC)</option>
                  <option value="WBC">WBC (White Blood Cells)</option>
                  <option value="Plasma">Plasma (Fresh Frozen Plasma - FFP)</option>
                  <option value="Platelets">Platelets (Platelet Concentrate)</option>
                  <option value="Cryoprecipitate">Cryoprecipitate</option>
                  <option value="Whole Blood">Whole Blood</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Requested Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={reqQuantity}
                  onChange={(e) => setReqQuantity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Priority Level</label>
                <select
                  value={reqPriority}
                  onChange={(e) => setReqPriority(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="EMERGENCY">EMERGENCY</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Required Date</label>
                <input
                  type="date"
                  value={reqDate}
                  onChange={(e) => setReqDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reason / Clinical Context</label>
                <textarea
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 h-20"
                  placeholder="e.g. Urgent trauma surgery requirement"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 font-bold text-white rounded-xl text-sm"
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESPOND / ACCEPT REQUEST */}
      {showRespondModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">Accept Request Quantity</h3>
              <button onClick={() => setShowRespondModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl space-y-1 text-xs text-slate-300">
              <div>Requesting Facility: <strong className="text-white">{selectedRequest.requesting_facility_name}</strong></div>
              <div>Blood Group & Component: <strong className="text-rose-400">{selectedRequest.blood_group} ({selectedRequest.blood_component || 'RBC'})</strong></div>
              <div>Remaining Needed: <strong className="text-[#3c2415]">{selectedRequest.remaining_quantity} units</strong></div>
            </div>

            <form onSubmit={handleRespondRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Offered / Accepted Quantity</label>
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
                Confirm Allocation & Create Transfer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: GENERATE OTP DISPLAY */}
      {otpModalData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
              <KeyRound className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-xl text-white">OTP Generated Successfully</h3>
            <p className="text-xs text-slate-400">
              Communicate this 6-digit OTP to the authorized sender representative to complete transfer:
            </p>

            <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 text-3xl font-extrabold font-mono tracking-widest text-indigo-400">
              {otpModalData.otp_code}
            </div>

            <p className="text-[11px] text-[#3c2415]">Valid for 10 minutes (single-use).</p>

            <button
              onClick={() => setOtpModalData(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: ENTER OTP (SENDER) */}
      {showEnterOtpModal && selectedTransferForOtp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">Verify Handshake OTP Code</h3>
              <button onClick={() => setShowEnterOtpModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl space-y-1 text-xs text-slate-300">
              <div>Transfer ID: <strong className="font-mono text-white">{selectedTransferForOtp.transfer_id}</strong></div>
              <div>Receiver: <strong className="text-white">{selectedTransferForOtp.receiver_facility_name}</strong></div>
              <div>Quantity: <strong className="text-rose-400">{selectedTransferForOtp.quantity} units {selectedTransferForOtp.blood_group} ({selectedTransferForOtp.blood_component || 'RBC'})</strong></div>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Enter 6-Digit OTP from Receiver</label>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="483921"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-center font-mono text-xl tracking-widest text-white rounded-xl p-3 focus:border-rose-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 font-bold text-white rounded-xl text-sm shadow-lg shadow-rose-900/30"
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
