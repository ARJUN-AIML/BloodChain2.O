import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/StatCard';
import {
  Building2, CheckSquare, Clock, ArrowUpRight, CheckCircle2, XCircle,
  PlusCircle, RefreshCw, AlertCircle, History, FileText, Send, Droplet
} from 'lucide-react';

export const HospitalApprovalDesk = () => {
  const { facility, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('queue');

  // State
  const [inventory, setInventory] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [outgoingTransfers, setOutgoingTransfers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    blood_group: 'O+',
    requested_quantity: 5,
    priority: 'HIGH',
    reason: '',
    required_date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
  });

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [offerQuantity, setOfferQuantity] = useState(5);

  const fetchData = async () => {
    setLoading(true);
    setActionError('');
    try {
      const [invRes, sentRes, recvRes, outRes, audRes] = await Promise.all([
        api.get('/inventory/'),
        api.get('/requests/sent/'),
        api.get('/requests/received/'),
        api.get('/transfers/outgoing/'),
        api.get('/audit/')
      ]);

      setInventory(invRes.data);
      setSentRequests(sentRes.data);
      setReceivedRequests(recvRes.data);
      setOutgoingTransfers(outRes.data);
      setAuditLogs(audRes.data);
    } catch (err) {
      console.error('Error fetching approval desk data:', err);
      setActionError(err.response?.data?.detail || 'Failed to load approval desk data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    try {
      await api.post('/requests/', createData);
      setActionSuccess(`Blood Request for ${createData.requested_quantity} units of ${createData.blood_group} issued successfully!`);
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to create blood request.');
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
      setActionSuccess(`Accepted ${res.data.allocation.accepted_quantity} units for request ${selectedRequest.requesting_facility_name}. Transfer created for approval.`);
      setShowRespondModal(false);
      setSelectedRequest(null);
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to accept supply request.');
    }
  };

  const handleApproveTransfer = async (transferId) => {
    setActionError('');
    setActionSuccess('');
    try {
      await api.post(`/transfers/${transferId}/approve/`);
      setActionSuccess('Transfer authorized! Stock reserved. Handoff to Logistics for physical dispatch.');
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to authorize transfer.');
    }
  };

  // Metrics
  const pendingSent = sentRequests.filter(r => r.status === 'PENDING_APPROVAL').length;
  const awaitingReceived = receivedRequests.length;
  const pendingTransfers = outgoingTransfers.filter(t => t.status === 'CREATED').length;
  const approvedTransfers = outgoingTransfers.filter(t => t.status !== 'CREATED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-3xl border border-indigo-500/20 glass-panel">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Hospital Clinical Decision Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hospital Approval Desk
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review requests, authorize blood allocation, and approve transfers for <strong className="text-slate-200">{facility?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 flex items-center space-x-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
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

      {/* Notifications */}
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

      {/* Overview Workload Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Pending Requests Sent"
          value={pendingSent}
          subtext="Awaiting partner fulfillment"
          icon={Clock}
          color="indigo"
        />
        <StatCard
          title="Requests Awaiting Response"
          value={awaitingReceived}
          subtext="Received supply requests"
          icon={FileText}
          color="amber"
        />
        <StatCard
          title="Pending Transfer Approvals"
          value={pendingTransfers}
          subtext="Transfers awaiting authorization"
          icon={CheckSquare}
          color="rose"
        />
        <StatCard
          title="Approved Transfers"
          value={approvedTransfers}
          subtext="Authorized for logistics"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'queue', label: `Approval Queue (${awaitingReceived + pendingTransfers})` },
          { id: 'requests_sent', label: `Requests Issued (${sentRequests.length})` },
          { id: 'transfer_approvals', label: `Transfer Approvals (${pendingTransfers})` },
          { id: 'stock_summary', label: 'Inventory Stock Summary' },
          { id: 'audit', label: 'Approval Audit History' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: APPROVAL QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>Received Requests Awaiting Supply Decision</span>
              </h3>
              <span className="text-xs text-slate-400">Review requests from partner facilities</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Request ID</th>
                    <th className="p-3">Requesting Hospital</th>
                    <th className="p-3">Blood Group</th>
                    <th className="p-3">Remaining Needed</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Supply Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {receivedRequests.length === 0 ? (
                    <tr><td colSpan="6" className="p-4 text-center text-slate-500">No pending supply requests awaiting response.</td></tr>
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
                              setOfferQuantity(Math.min(5, req.remaining_quantity));
                              setShowRespondModal(true);
                            }}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
                          >
                            Review & Allocate
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

      {/* TAB 2: REQUESTS ISSUED */}
      {activeTab === 'requests_sent' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Send className="w-5 h-5 text-indigo-400" />
              <span>Blood Requests Issued by {facility?.name}</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Request ID</th>
                  <th className="p-3">Blood Group</th>
                  <th className="p-3">Requested</th>
                  <th className="p-3">Fulfilled</th>
                  <th className="p-3">Remaining</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sentRequests.length === 0 ? (
                  <tr><td colSpan="7" className="p-4 text-center text-slate-500">No requests issued yet.</td></tr>
                ) : (
                  sentRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-100">{req.request_id}</td>
                      <td className="p-3 font-bold text-rose-400">{req.blood_group}</td>
                      <td className="p-3">{req.requested_quantity} units</td>
                      <td className="p-3 font-bold text-emerald-400">{req.fulfilled_quantity} units</td>
                      <td className="p-3 font-bold text-amber-400">{req.remaining_quantity} units</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          {req.priority}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${req.status === 'FULFILLED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'}`}>
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
      )}

      {/* TAB 3: TRANSFER APPROVALS */}
      {activeTab === 'transfer_approvals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-rose-400" />
              <span>Transfers Awaiting Clinical Authorization</span>
            </h3>
            <span className="text-xs text-slate-400">Authorizing reserves stock and hands off to Logistics</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Transfer ID</th>
                  <th className="p-3">Receiver Hospital</th>
                  <th className="p-3">Blood Group</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Clinical Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {outgoingTransfers.filter(t => t.status === 'CREATED').length === 0 ? (
                  <tr><td colSpan="6" className="p-4 text-center text-slate-500">No transfers currently awaiting authorization.</td></tr>
                ) : (
                  outgoingTransfers.filter(t => t.status === 'CREATED').map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-100">{tr.transfer_id}</td>
                      <td className="p-3 text-slate-200">{tr.receiver_facility_name}</td>
                      <td className="p-3 font-bold text-rose-400">{tr.blood_group}</td>
                      <td className="p-3">{tr.quantity} units</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                          {tr.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleApproveTransfer(tr.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                        >
                          Authorize Transfer
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

      {/* TAB 4: STOCK SUMMARY */}
      {activeTab === 'stock_summary' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Droplet className="w-5 h-5 text-rose-400" />
            <span>Available Stock Summary</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {inventory.map((inv) => (
              <div key={inv.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="text-lg font-extrabold text-white">{inv.blood_group}</div>
                <div className="text-xs text-slate-400 mt-1">Available: <strong className="text-emerald-400">{inv.available_units} units</strong></div>
                <div className="text-xs text-slate-400">Reserved: <span className="text-amber-400">{inv.reserved_units} units</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-slate-400" />
            <span>Hospital Approval Desk Audit History</span>
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
                  <tr><td colSpan="5" className="p-4 text-center text-slate-500">No approval audit logs found.</td></tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-3 text-indigo-400">{log.user_name}</td>
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

      {/* MODAL 1: CREATE REQUEST */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">Create Blood Supply Request</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Blood Group</label>
                <select
                  value={createData.blood_group}
                  onChange={(e) => setCreateData({ ...createData, blood_group: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 focus:border-rose-500"
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Requested Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={createData.requested_quantity}
                  onChange={(e) => setCreateData({ ...createData, requested_quantity: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                <select
                  value={createData.priority}
                  onChange={(e) => setCreateData({ ...createData, priority: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5"
                >
                  <option value="CRITICAL">CRITICAL (Immediate Trauma/Emergency)</option>
                  <option value="HIGH">HIGH (Urgent Surgery)</option>
                  <option value="MEDIUM">MEDIUM (Scheduled Procedure)</option>
                  <option value="LOW">LOW (Stock Replenishment)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reason / Clinical Notes</label>
                <textarea
                  rows="2"
                  value={createData.reason}
                  onChange={(e) => setCreateData({ ...createData, reason: e.target.value })}
                  placeholder="Emergency surgery demand..."
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 font-bold text-white rounded-xl text-sm shadow-lg shadow-rose-900/30"
              >
                Submit Clinical Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESPOND TO REQUEST */}
      {showRespondModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">Review & Allocate Supply</h3>
              <button onClick={() => setShowRespondModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl space-y-1 text-xs text-slate-300">
              <div>Requesting Hospital: <strong className="text-white">{selectedRequest.requesting_facility_name}</strong></div>
              <div>Blood Group: <strong className="text-rose-400">{selectedRequest.blood_group}</strong></div>
              <div>Remaining Needed: <strong className="text-amber-400">{selectedRequest.remaining_quantity} units</strong></div>
            </div>

            <form onSubmit={handleRespondRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Offered Quantity to Allocate</label>
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
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold text-white rounded-xl text-sm"
              >
                Accept Allocation & Create Transfer
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
