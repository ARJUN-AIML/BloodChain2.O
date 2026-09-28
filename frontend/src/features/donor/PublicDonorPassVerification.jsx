import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Droplet, 
  MapPin, 
  Building2, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft, 
  Printer, 
  ExternalLink 
} from 'lucide-react';

export const PublicDonorPassVerification = ({ tokenOverride, onBackToApp }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract secure token from URL or prop
  const getToken = () => {
    if (tokenOverride) return tokenOverride;
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) return params.get('token');
    if (params.get('id')) return params.get('id');
    if (params.get('verify')) return params.get('verify');

    // Extract from path e.g. /verify/:token or /verify/donor/:token
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2 && pathParts[0] === 'verify') {
      return pathParts[1] === 'donor' && pathParts[2] ? pathParts[2] : pathParts[1];
    }
    return null;
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError('This BloodChain QR code is invalid or is no longer active.\n\nPlease contact BloodChain support/facility staff.');
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        setLoading(true);
        setError(null);

        // Determine API base: use relative /api when accessed via tunnel or remote device
        let apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
        
        // If apiBase points to localhost but the page is opened on a remote phone/tunnel,
        // switch to relative '/api' so traffic flows through the Vite tunnel proxy
        if (typeof window !== 'undefined' && window.location) {
          const isRemoteDevice = window.location.hostname !== 'localhost' && 
                                 window.location.hostname !== '127.0.0.1' && 
                                 window.location.hostname !== '0.0.0.0';
          if (isRemoteDevice && (apiBase.includes('localhost') || apiBase.includes('127.0.0.1'))) {
            apiBase = '/api';
          }
        }

        let res;
        try {
          const cleanBase = apiBase.replace(/\/+$/, '');
          res = await axios.get(`${cleanBase}/verify/${token}/`);
        } catch (firstErr) {
          // Fallback to relative /api if absolute base failed
          if (apiBase !== '/api') {
            res = await axios.get(`/api/verify/${token}/`);
          } else {
            throw firstErr;
          }
        }

        if (res.data && res.data.status === 'verified') {
          setData(res.data);
        } else {
          setError('This BloodChain QR code is invalid or is no longer active.\n\nPlease contact BloodChain support/facility staff.');
        }
      } catch (err) {
        console.error('QR Verification error:', err);
        setError('This BloodChain QR code is invalid or is no longer active.\n\nPlease contact BloodChain support/facility staff.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [tokenOverride]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#dbcfb9] py-8 px-4 flex flex-col items-center justify-center font-sans antialiased text-stone-900">
      {/* Top Header Actions */}
      <div className="max-w-md w-full flex items-center justify-between mb-4">
        <button
          onClick={onBackToApp || (() => { window.location.href = '/'; })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white/80 hover:bg-white rounded-xl shadow-sm border border-stone-300 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> BloodChain Home
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-sm transition"
        >
          <Printer className="w-3.5 h-3.5" /> Print
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-xl border border-stone-200 space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-rose-600 border-t-transparent animate-spin mx-auto" />
          <h3 className="text-base font-bold text-stone-800">Verifying BloodChain QR...</h3>
          <p className="text-xs text-stone-500 font-mono">Validating cryptographic token on network ledger</p>
        </div>
      ) : error ? (
        /* Invalid / Expired QR State (Section 12) */
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-red-200 text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-9 h-9" />
          </div>

          <h2 className="text-xl font-black text-stone-900 uppercase tracking-wide">
            ❌ QR VERIFICATION FAILED
          </h2>

          <p className="text-xs text-stone-600 whitespace-pre-line leading-relaxed max-w-xs mx-auto">
            {error}
          </p>

          <div className="pt-2">
            <button
              onClick={() => { window.location.href = '/'; }}
              className="px-6 py-2 rounded-xl bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 transition"
            >
              Return to Portal
            </button>
          </div>
        </div>
      ) : (
        /* Exact Formatted Verification Layout (Sections 1 & 2) */
        <div 
          id="qr-verification-document"
          className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-300/80 overflow-hidden animate-fade-in"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-neutral-900 text-white p-6 text-center border-b border-stone-800 relative">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-xl">🩸</span>
              <h1 className="text-lg font-black tracking-wider uppercase text-white">
                BLOODCHAIN VERIFICATION
              </h1>
            </div>
            <p className="text-[10px] text-stone-400 font-mono tracking-widest uppercase">
              Decentralized Blood Safety & Donation Ledger
            </p>
          </div>

          {/* Verification Content Body */}
          <div className="p-6 sm:p-7 space-y-6">
            
            {/* SECTION 1: DONOR DETAILS */}
            <div className="space-y-3">
              <div className="border-b border-stone-200 pb-1.5 flex items-center justify-between">
                <h2 className="text-xs font-mono font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
                  🩸 DONOR DETAILS
                </h2>
                <span className="text-[10px] font-mono text-stone-400">AUTHENTICATED</span>
              </div>

              <div className="space-y-3 bg-stone-50/80 rounded-2xl p-4 border border-stone-200">
                <div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase block">Name</span>
                  <span className="text-base font-bold text-stone-900">{data.donor.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-stone-400 uppercase block">Donor ID</span>
                    <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block mt-0.5">
                      {data.donor.donor_id}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-stone-400 uppercase block">Blood Group</span>
                    <span className="text-xs font-bold text-stone-800 inline-block mt-0.5">
                      {data.donor.blood_group}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase block">Registration Status</span>
                  <span className={`text-xs font-bold inline-flex items-center gap-1.5 mt-0.5 px-2.5 py-1 rounded-lg ${
                    data.donor.registration_status.includes('❌') 
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : data.donor.registration_status.includes('⚠️')
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {data.donor.registration_status}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 2: DONATION CAMP DETAILS (Preserved & Extended) */}
            {data.camp ? (
              <div className="space-y-3">
                <div className="border-b border-stone-200 pb-1.5 flex items-center justify-between">
                  <h2 className="text-xs font-mono font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
                    📍 DONATION CAMP
                  </h2>
                  <span className="text-[10px] font-mono text-stone-400">VENUE DETAILS</span>
                </div>

                <div className="space-y-3 bg-stone-50/80 rounded-2xl p-4 border border-stone-200">
                  <div>
                    <span className="text-[10px] font-mono text-stone-400 uppercase block">Camp Name</span>
                    <span className="text-sm font-bold text-stone-900">{data.camp.camp_name}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-stone-400 uppercase block">Organised By</span>
                    <span className="text-xs font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-stone-500" />
                      {data.camp.organized_by}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-stone-400 uppercase block">Camp Venue</span>
                    <span className="text-xs font-semibold text-stone-800 flex items-start gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>{data.camp.venue_name}</span>
                    </span>
                    {data.camp.venue_address && (
                      <p className="text-[11px] text-stone-500 pl-4 mt-0.5">{data.camp.venue_address}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-200/60">
                    <div>
                      <span className="text-[10px] font-mono text-stone-400 uppercase block">Date</span>
                      <span className="text-xs font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        {data.camp.date}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-stone-400 uppercase block">Time</span>
                      <span className="text-xs font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {data.camp.time}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-stone-400 uppercase block">Camp Status</span>
                    <span className="text-xs font-bold inline-block mt-0.5">
                      {data.camp.camp_status}
                    </span>
                  </div>

                  {data.camp.preferred_timeslot && (
                    <div className="pt-1 text-[11px] text-stone-600 font-mono">
                      <span>Scheduled Arrival Slot: </span>
                      <strong className="text-rose-700">{data.camp.preferred_timeslot}</strong>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* No Specific Camp Attached */
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs text-stone-600 text-center">
                <span className="text-stone-400 block font-mono text-[10px] uppercase">Donation Camp</span>
                <span className="font-medium">No active camp scheduled for this token.</span>
              </div>
            )}

            {/* Bottom Verification Footer */}
            <div className="pt-2 border-t border-stone-200 text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Information verified by BloodChain</span>
              </div>
              <p className="text-[10px] text-stone-400 font-mono">
                Official Decoupled Verification System • Non-Transferable
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
