import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  QrCode, 
  AlertCircle,
  FileCheck,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export const DonorRegistrations = ({ donor, onNavigateToCertificates }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [activePassReg, setActivePassReg] = useState(null);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/donors/me/registrations/');
      setRegistrations(res.data || []);
    } catch (err) {
      console.error('Failed to load registrations:', err);
      setError('Unable to load your camp registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCancel = async (campId) => {
    if (!window.confirm('Are you sure you want to cancel this donation slot registration?')) return;
    try {
      setCancellingId(campId);
      await api.delete(`/camps/${campId}/cancel_registration/`);
      fetchRegistrations();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel registration.');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-stone-300/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            Camp Passes & Scheduling
          </span>
          <h2 className="text-2xl font-bold text-stone-900 mt-1">My Camp Registrations</h2>
          <p className="text-sm text-stone-600">
            Track your registered donation slots, view check-in passes, and view post-donation status.
          </p>
        </div>

        <button
          onClick={fetchRegistrations}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition self-start sm:self-auto border border-stone-300"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-stone-400 font-mono text-sm">
          Loading registrations...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
          {error}
        </div>
      ) : registrations.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-300/80 shadow-sm space-y-3">
          <Calendar className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-700">No Camp Registrations Found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            You haven't registered for any upcoming donation drives yet. Visit the Camp Locator map to find convenient camps near you.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {registrations.map((reg) => (
            <div
              key={reg.id || reg.camp_id}
              className="bg-white rounded-2xl p-6 border border-stone-300/80 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    reg.status === 'CHECKED_IN'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : reg.status === 'COMPLETED'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : reg.status === 'CANCELLED'
                      ? 'bg-stone-100 text-stone-600 border border-stone-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {reg.status === 'CHECKED_IN' ? '✓ CHECKED IN AT VENUE' : reg.status}
                  </span>

                  <span className="text-[11px] font-mono text-stone-400">
                    Registered {formatDate(reg.registered_at)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-stone-900 leading-snug">
                  {reg.camp_name || reg.camp?.camp_name}
                </h3>

                <div className="space-y-1.5 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200/70">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-800">{reg.venue_name || reg.camp?.venue_name}</strong>
                      <p className="text-[11px] text-stone-500">{reg.venue_address || reg.camp?.venue_address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-stone-500">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Organizer: <strong>{reg.organizer_name || reg.camp?.organizer_name}</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5 text-stone-500">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatDate(reg.start_datetime || reg.camp?.start_datetime)}</span>
                  </div>
                </div>

                {reg.preferred_timeslot && (
                  <div className="flex items-center gap-1.5 text-xs text-stone-700 bg-rose-50/60 border border-rose-200/60 px-3 py-1.5 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-rose-600" />
                    <span>Arrival Slot: <strong>{reg.preferred_timeslot}</strong></span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                {reg.status === 'REGISTERED' && (
                  <>
                    <button
                      onClick={() => setActivePassReg(reg)}
                      className="flex-1 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <QrCode className="w-3.5 h-3.5" /> View Check-In Pass
                    </button>
                    <button
                      onClick={() => handleCancel(reg.camp_id || reg.camp?.camp_id)}
                      disabled={cancellingId === (reg.camp_id || reg.camp?.camp_id)}
                      className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-700 text-xs font-medium transition border border-stone-200"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {reg.status === 'CHECKED_IN' && (
                  <div className="w-full text-center py-2 px-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Check-in verified! Medical officer will verify donation shortly.
                  </div>
                )}

                {reg.status === 'COMPLETED' && (
                  <button
                    onClick={onNavigateToCertificates}
                    className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <FileCheck className="w-4 h-4" /> View Issued Certificate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Check-In Pass Modal */}
      {activePassReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center relative">
            <button
              onClick={() => setActivePassReg(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700"
            >
              ✕
            </button>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 uppercase tracking-wider">
              OFFICIAL CAMP CHECK-IN PASS
            </span>

            <h3 className="text-lg font-bold text-stone-900 mt-2">
              {activePassReg.camp_name || activePassReg.camp?.camp_name}
            </h3>

            <p className="text-xs text-stone-500 mt-1">
              Present this token to the desk officer at the camp entrance.
            </p>

            <div className="my-6 p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col items-center justify-center">
              <QRCodeSVG
                value={donor?.qr_token || donor?.donor_id}
                size={160}
                level="H"
              />
              <span className="mt-3 text-xs font-mono font-bold text-stone-700">
                {donor?.donor_id}
              </span>
            </div>

            <div className="text-left text-xs bg-stone-100/70 p-3 rounded-xl space-y-1 font-mono text-stone-600">
              <div>Donor: <strong>{donor?.name}</strong> ({donor?.blood_group})</div>
              <div>Slot: <strong>{activePassReg.preferred_timeslot || 'General Slot'}</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
