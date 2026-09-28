import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, 
  Droplet, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  MapPin, 
  Building2, 
  Heart, 
  Award, 
  QrCode, 
  Printer, 
  ArrowLeft,
  AlertCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export const PublicDonorPassVerification = ({ identifierOverride, campIdOverride, onBackToApp }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract identifier and camp from URL if not overridden
  const getParams = () => {
    const params = new URLSearchParams(window.location.search);
    const pathParts = window.location.pathname.split('/').filter(Boolean);

    // Matches /verify/donor/:id or /verify-donor?id=...
    let id = identifierOverride || params.get('id') || params.get('verify_donor') || params.get('donor_id') || params.get('token');
    if (!id && pathParts.length >= 3 && pathParts[0] === 'verify' && pathParts[1] === 'donor') {
      id = pathParts[2];
    }
    const camp = campIdOverride || params.get('camp') || params.get('camp_id');
    return { id: id || 'BC-D-20992', camp };
  };

  useEffect(() => {
    const { id, camp } = getParams();
    const fetchVerification = async () => {
      try {
        setLoading(true);
        setError(null);
        const query = camp ? `?camp=${camp}` : '';
        const res = await axios.get(`http://127.0.0.1:8000/api/donors/public-verify/${id}/${query}`);
        setData(res.data);
      } catch (err) {
        console.error('Public verification error:', err);
        setError(err.response?.data?.detail || 'Unable to verify donor record or pass. The token may be invalid.');
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [identifierOverride, campIdOverride]);

  const handlePrint = () => {
    window.print();
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

  return (
    <div className="min-h-screen bg-[#dbcfb9] py-10 px-4 flex flex-col items-center justify-center">
      {/* Top Navigation */}
      <div className="max-w-2xl w-full flex items-center justify-between mb-6">
        <button
          onClick={onBackToApp || (() => { window.location.href = '/'; })}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white/80 hover:bg-white rounded-xl shadow-sm border border-stone-300 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Return to BloodChain Portal
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-sm transition"
        >
          <Printer className="w-4 h-4" /> Print Verification
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-xl border border-stone-200 space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-rose-500 border-t-transparent animate-spin mx-auto" />
          <h3 className="text-base font-bold text-stone-800">Verifying BloodChain Pass...</h3>
          <p className="text-xs text-stone-500 font-mono">Querying decentralized donor ledger</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-stone-200 space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">Verification Failed</h3>
          <p className="text-xs text-stone-600">{error}</p>
          <button
            onClick={() => { window.location.href = '/'; }}
            className="mt-4 px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold"
          >
            Go to Home
          </button>
        </div>
      ) : (
        /* Verified Donor & Pass Card */
        <div 
          id="public-pass-card"
          className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-neutral-900 text-white p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center shadow-md">
                  <Droplet className="w-4 h-4 text-white fill-white" />
                </div>
                <div>
                  <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                    BloodChain <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">VERIFIED PASS</span>
                  </h1>
                  <p className="text-[10px] text-stone-400 font-mono tracking-wider">OFFICIAL REGIONAL MEDICAL NETWORK</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {data.donor_status?.toUpperCase() || 'VERIFIED DONOR'}
              </div>
            </div>

            {/* Donor Main Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div>
                <p className="text-[10px] text-stone-400 font-mono uppercase tracking-widest">Authenticated Donor</p>
                <h2 className="text-2xl font-black text-white tracking-wide">{data.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
                    {data.donor_id}
                  </span>
                  <span className="text-xs text-stone-400 font-mono">
                    Member Since {data.member_since} • {data.city}, {data.state}
                  </span>
                </div>
              </div>

              {/* Blood Group Circle */}
              <div className="flex sm:flex-col items-center justify-center bg-rose-600/20 border border-rose-500/40 rounded-2xl px-5 py-3 text-center self-start sm:self-auto">
                <span className="text-2xl font-black text-rose-400">{data.blood_group}</span>
                <span className="text-[10px] font-mono text-stone-300 uppercase">
                  Rh {data.blood_group?.includes('-') ? 'Negative' : 'Positive'}
                </span>
              </div>
            </div>
          </div>

          {/* Pass & Registration Details (If Camp Attached) */}
          {data.pass_registration && (
            <div className="p-6 bg-stone-50 border-b border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 uppercase font-mono flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-600" /> Confirmed Camp Appointment
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {data.pass_registration.status === 'CHECKED_IN' ? '✓ CHECKED IN AT DESK' : '✓ REGISTRATION APPROVED'}
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-2.5">
                <h3 className="text-base font-bold text-stone-900">
                  {data.pass_registration.camp_name}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-600">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-800">{data.pass_registration.venue_name}</strong>
                      <p className="text-[11px] text-stone-500">{data.pass_registration.venue_address}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>Organized by: <strong>{data.pass_registration.organizer_name}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Arrival Slot: <strong className="text-amber-800">{data.pass_registration.preferred_timeslot}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Donor Medical Impact Ledger */}
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h4 className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider mb-3">
                Verified Medical Contribution History
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-center">
                  <Heart className="w-5 h-5 text-rose-600 mx-auto mb-1" />
                  <span className="text-xl font-black text-stone-900">{data.verified_donations_count}</span>
                  <p className="text-[10px] font-mono text-stone-500 uppercase mt-0.5">Donations</p>
                </div>

                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-center">
                  <Sparkles className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <span className="text-xl font-black text-stone-900">{data.lives_impacted}</span>
                  <p className="text-[10px] font-mono text-stone-500 uppercase mt-0.5">Lives Impacted</p>
                </div>

                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-center">
                  <Award className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                  <span className="text-xl font-black text-stone-900">{data.certificates_count}</span>
                  <p className="text-[10px] font-mono text-stone-500 uppercase mt-0.5">Certificates</p>
                </div>
              </div>
            </div>

            {/* Verification Security Footer */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-emerald-950">
                  Cryptographically Verified Medical Credential
                </p>
                <p className="text-emerald-800 leading-relaxed text-[11px]">
                  This record is registered on the BloodChain network. The donor identity and donation pass are authentic and accepted by all participating hospital and blood-bank reception desks.
                </p>
                <div className="pt-1 text-[10px] font-mono text-emerald-700">
                  Verified At: {new Date(data.verification_timestamp).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
