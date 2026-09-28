import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/StatCard';
import {
  Building2, CheckSquare, Clock, ArrowUpRight, CheckCircle2, XCircle,
  PlusCircle, RefreshCw, AlertCircle, History, FileText, Send, Droplet,
  ShieldCheck, X
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
    blood_component: 'RBC',
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
        api.get('/inventory/').catch(() => ({ data: [] })),
        api.get('/requests/sent/').catch(() => ({ data: [] })),
        api.get('/requests/received/').catch(() => ({ data: [] })),
        api.get('/transfers/outgoing/').catch(() => ({ data: [] })),
        api.get('/audit/').catch(() => ({ data: [] }))
      ]);

      setInventory(invRes.data || []);
      setSentRequests(sentRes.data || []);
      setReceivedRequests(recvRes.data || []);
      setOutgoingTransfers(outRes.data || []);
      setAuditLogs(audRes.data || []);
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
      setActionSuccess(`Blood Request for ${createData.requested_quantity} units of ${createData.blood_group} (${createData.blood_component}) issued successfully.`);
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
      setActionSuccess(`Allocated ${res.data.allocation.accepted_quantity} units for request from ${selectedRequest.requesting_facility_name}. Transfer created for medical approval.`);
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
      setActionSuccess('Transfer authorized! Units reserved in inventory. Handed off to Logistics for physical dispatch.');
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
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="clinical-card p-6 border-slate-800 bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Clinical Medical Approval Desk &bull; Section 4</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Hospital Clinical Decision Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Emergency requisition issuance, partner allocation, and transfer authorization for <strong className="text-slate-200">{facility?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Blood Request</span>
          </button>
          
          <button
            type="button"
            onClick={fetchData}
            title="Refresh clinical data"
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

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard
          title="Pending Requests Sent"
          value={pendingSent}
          subtext="Awaiting partner fulfillment"
          icon={Clock}
          color="indigo"
          badge="OUTBOUND"
        />
        <StatCard
          title="Requests In Queue"
          value={awaitingReceived}
          subtext="Partner requests awaiting decision"
          icon={FileText}
          color="amber"
          badge="INBOUND"
        />
        <StatCard
          title="Transfers Awaiting Auth"
          value={pendingTransfers}
          subtext="Reserved units pending sign-off"
          icon={CheckSquare}
          color="red"
          badge="CRITICAL"
        />
        <StatCard
          title="Authorized Transfers"
          value={approvedTransfers}
          subtext="Handed over to logistics"
          icon={CheckCircle2}
          color="emerald"
          badge="ACTIVE"
        />
      </div>

      {/* Segmented Tab Navigation */}
      <div className="flex items-center p-1 rounded-lg bg-stone-200/70 border border-stone-300 overflow-x-auto" role="tablist">
        {[
          { id: 'queue', label: `Approval Queue (${awaitingReceived + pendingTransfers})` },
          { id: 'requests_sent', label: `Requests Issued (${sentRequests.length})` },
          { id: 'transfer_approvals', label: `Transfer Approvals (${pendingTransfers})` },
          { id: 'stock_summary', label: 'Inventory Stock Summary' },
          { id: 'audit', label: 'Approval Audit History' },
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

      {/* TAB 1: APPROVAL QUEUE */}
      {activeTab === 'queue' && (
        <div className="clinical-card border-slate-800 bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#3c2415]" />
              <span>Received Requests Awaiting Supply Decision</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Total Pending: {receivedRequests.length}</span>
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
                      No inbound supply requests pending clinical decision.
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
                      <td className="py-3 px-4 font-semibold text-[#3c2415] font-mono">{req.remaining_quantity} units</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          req.priority === 'CRITICAL' 
                            ? 'bg-red-950/60 text-red-300 border-red-800' 
                            : req.priority === 'HIGH'
                            ? 'bg-[#f7ede0] text-[#3d2212] border-[#d8c2aa]'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(req);
                            setOfferQuantity(Math.min(5, req.remaining_quantity));
                            setShowRespondModal(true);
                          }}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold rounded-md text-xs transition-colors cursor-pointer"
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
      )}

      {/* TAB 2: REQUESTS ISSUED */}
      {activeTab === 'requests_sent' && (
        <div className="clinical-card border-slate-800 bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-400" />
              <span>Blood Requests Issued by {facility?.name}</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Issued Total: {sentRequests.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Blood Group</th>
                  <th className="py-3 px-4">Requested</th>
                  <th className="py-3 px-4">Fulfilled</th>
                  <th className="py-3 px-4">Remaining</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sentRequests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      No blood supply requests issued yet. Click "Create Blood Request" above to initiate a requisition.
                    </td>
                  </tr>
                ) : (
                  sentRequests.map((req) => (
                    <tr key={req.id} className="clinical-table-row">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-200">{req.request_id}</td>
                      <td className="py-3 px-4 font-mono text-sm">
                        <span className="font-bold text-red-400">{req.blood_group}</span>
                        <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                          {req.blood_component || 'RBC'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">{req.requested_quantity} units</td>
                      <td className="py-3 px-4 font-bold text-[#2d1b14] font-mono">{req.fulfilled_quantity} units</td>
                      <td className="py-3 px-4 font-bold text-[#3c2415] font-mono">{req.remaining_quantity} units</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          req.priority === 'CRITICAL'
                            ? 'bg-red-950/60 text-red-300 border-red-800'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                          req.status === 'FULFILLED'
                            ? 'bg-[#ede5d5] text-[#2d1b14] border-[#c4b59f]'
                            : 'bg-[#f7ede0] text-[#3d2212] border-[#d8c2aa]'
                        }`}>
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
        <div className="clinical-card border-slate-800 bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#2d1b14]" />
                <span>Transfers Awaiting Medical Authorization</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Authorizing commits inventory reservation and moves custody to Logistics.</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Pending Auth: {outgoingTransfers.filter(t => t.status === 'CREATED').length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Transfer ID</th>
                  <th className="py-3 px-4">Receiver Hospital</th>
                  <th className="py-3 px-4">Blood Group</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Medical Sign-off</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {outgoingTransfers.filter(t => t.status === 'CREATED').length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      No transfers currently awaiting medical authorization.
                    </td>
                  </tr>
                ) : (
                  outgoingTransfers.filter(t => t.status === 'CREATED').map((tr) => (
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f7ede0] text-[#3d2212] border border-[#d8c2aa]">
                          {tr.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleApproveTransfer(tr.id)}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-md text-xs transition-colors cursor-pointer"
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
        <div className="clinical-card p-6 border-slate-800 bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Droplet className="w-4 h-4 text-red-500" />
              <span>Active Facility Inventory Balance</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">{facility?.name}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {inventory.map((inv) => (
              <div key={inv.id} className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold text-white font-mono">{inv.blood_group}</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                      {inv.blood_component || 'RBC'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    WHO-ISBT
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Available:</span>
                    <strong className="text-[#2d1b14] font-mono">{inv.available_units} units</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Reserved:</span>
                    <span className="text-[#3c2415] font-mono">{inv.reserved_units} units</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT */}
      {activeTab === 'audit' && (
        <div className="clinical-card border-slate-800 bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <span>Hospital Approval Desk Audit History</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Immutable Log Entries: {auditLogs.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Officer</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">
                      No approval audit entries recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="clinical-table-row">
                      <td className="py-3 px-4 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-4 text-indigo-400">{log.user_name}</td>
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

      {/* MODAL 1: CREATE REQUEST */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="clinical-card-elevated max-w-md w-full p-6 bg-slate-900 border-slate-700 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Create Blood Supply Requisition</h3>
              <button 
                type="button"
                onClick={() => setShowCreateModal(false)} 
                className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Required Blood Group <span className="text-red-400">*</span>
                </label>
                <select
                  value={createData.blood_group}
                  onChange={(e) => setCreateData({ ...createData, blood_group: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:ring-2 focus:ring-slate-600 focus:outline-none"
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Blood Component <span className="text-red-400">*</span>
                </label>
                <select
                  value={createData.blood_component}
                  onChange={(e) => setCreateData({ ...createData, blood_component: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:ring-2 focus:ring-slate-600 focus:outline-none"
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
                <label className="block text-slate-300 font-medium mb-1">
                  Quantity Required (Units) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={createData.requested_quantity}
                  onChange={(e) => setCreateData({ ...createData, requested_quantity: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono focus:ring-2 focus:ring-slate-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Clinical Priority <span className="text-red-400">*</span>
                </label>
                <select
                  value={createData.priority}
                  onChange={(e) => setCreateData({ ...createData, priority: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:ring-2 focus:ring-slate-600 focus:outline-none"
                >
                  <option value="CRITICAL">CRITICAL (Immediate Trauma / Emergency STAT)</option>
                  <option value="HIGH">HIGH (Scheduled Major Surgery)</option>
                  <option value="MEDIUM">MEDIUM (Elective Procedure)</option>
                  <option value="LOW">LOW (Inventory Buffer Restock)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Clinical Indication / Notes</label>
                <textarea
                  rows="2"
                  value={createData.reason}
                  onChange={(e) => setCreateData({ ...createData, reason: e.target.value })}
                  placeholder="e.g. Emergency polytrauma case in ICU OT-3..."
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:ring-2 focus:ring-slate-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-red-700 hover:bg-red-600 font-semibold text-white text-xs cursor-pointer shadow-sm"
                >
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESPOND TO REQUEST */}
      {showRespondModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="clinical-card-elevated max-w-md w-full p-6 bg-slate-900 border-slate-700 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Review & Allocate Blood Units</h3>
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
              <div className="flex justify-between">
                <span className="text-slate-400">Target Blood Group & Component:</span>
                <div className="flex items-center gap-1.5">
                  <strong className="text-red-400 font-mono">{selectedRequest.blood_group}</strong>
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                    {selectedRequest.blood_component || 'RBC'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Unfulfilled Requirement:</span>
                <strong className="text-[#3c2415] font-mono">{selectedRequest.remaining_quantity} units</strong>
              </div>
            </div>

            <form onSubmit={handleRespondRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Quantity to Allocate (Units) <span className="text-red-400">*</span>
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
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 font-semibold text-white rounded-lg text-xs cursor-pointer"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
