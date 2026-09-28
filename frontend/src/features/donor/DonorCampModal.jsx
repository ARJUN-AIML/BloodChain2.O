import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import confetti from 'canvas-confetti';
import { QRCodeCanvas } from 'qrcode.react';
import { downloadDonorPassCard } from './cardDownloadUtil';
import { getVerificationQrUrl, getLocalVerificationUrl } from './qrUrlUtil';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Droplet,
  Check,
  AlertCircle,
  Download,
  Printer,
  ExternalLink,
  QrCode,
  Sparkles
} from 'lucide-react';

export const DonorCampModal = ({ camp, donor, onClose, onRegistered }) => {
  const [timeslot, setTimeslot] = useState('09:00 AM - 10:00 AM');
  const [notes, setNotes] = useState('');
  const [healthChecked, setHealthChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!camp) return null;

  const timeslots = [
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 01:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM',
  ];

  // Secure token for public QR verification (No localhost, production HTTPS ready)
  const secureToken = successData?.qr_token || donor?.qr_token;
  const qrVerificationUrl = getVerificationQrUrl(secureToken);
  const localPreviewUrl = getLocalVerificationUrl(secureToken);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!healthChecked) {
      setError('Please acknowledge the basic donation eligibility criteria before registering.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.post(`/camps/${camp.camp_id}/register/`, {
        preferred_timeslot: timeslot,
        notes: notes
      });

      setSuccessData(res.data);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (cErr) {
        // ignore confetti failures
      }

      if (onRegistered) {
        onRegistered(res.data);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Registration failed. You may already be registered.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadCard = async () => {
    try {
      setDownloading(true);
      await downloadDonorPassCard({
        donor,
        camp,
        timeslot,
        qrValue: qrVerificationUrl
      });
    } catch (err) {
      console.error('Failed to download card:', err);
      alert('Unable to generate download image automatically. You can still use the Print Pass button.');
    } finally {
      setDownloading(false);
    }
  };

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

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-stone-950/60 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`bg-white rounded-3xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative max-h-[92vh] overflow-y-auto my-auto ${
        successData ? 'max-w-2xl' : 'max-w-xl'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {successData ? (
          /* Approved Pass Screen with Downloadable Card */
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                REGISTRATION APPROVED & CONFIRMED
              </div>
              <h3 className="text-2xl font-black text-stone-900">Your Camp Pass is Ready!</h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Scan the QR code with any smartphone camera to view verified donor details, or download your pass card below.
              </p>
            </div>

            {/* The Physical Card Simulation */}
            <div 
              id="printable-camp-pass-card"
              className="bg-gradient-to-br from-stone-900 via-stone-850 to-neutral-900 text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-rose-900/40 relative overflow-hidden"
            >
              {/* Subtle Holographic Radial Glows */}
              <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-rose-600/15 blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 w-52 h-52 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

              {/* Top Bar */}
              <div className="flex items-center justify-between border-b border-stone-800/80 pb-3 mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-900/30">
                    <Droplet className="w-4 h-4 text-white fill-white" />
                  </div>
                  <div>
                    <span className="font-extrabold tracking-tight text-sm text-stone-100 flex items-center gap-1.5">
                      BloodChain <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">CAMP PASS</span>
                    </span>
                    <p className="text-[9px] text-stone-400 font-mono tracking-widest uppercase">Decentralized Blood Network</p>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  PASS CONFIRMED
                </span>
              </div>

              {/* Middle Section: Donor Details & QR Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-center relative z-10">
                {/* Left 2 Columns: Donor & Camp Details */}
                <div className="sm:col-span-2 space-y-3">
                  <div>
                    <p className="text-[9px] font-mono text-stone-400 uppercase tracking-wider">Registered Donor</p>
                    <h4 className="text-xl font-bold text-white tracking-wide truncate">{donor?.name}</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] font-mono text-stone-400 uppercase">Permanent ID</p>
                      <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900/60 inline-block">
                        {donor?.donor_id}
                      </span>
                    </div>
                    <div>
                      <p className="text-[9px] font-mono text-stone-400 uppercase">Blood Group</p>
                      <span className="text-sm font-black text-rose-400">
                        {donor?.blood_group} <span className="text-[9px] font-mono text-stone-400">Rh {donor?.blood_group?.includes('-') ? 'Neg' : 'Pos'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Camp & Venue */}
                  <div className="space-y-1 text-xs text-stone-300 pt-1 border-t border-stone-800/80">
                    <p className="font-bold text-stone-100 truncate">{camp.camp_name}</p>
                    <p className="text-[11px] text-stone-400 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      {camp.venue_name}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-amber-400 pt-0.5 font-mono">
                      <span>📅 {formatDate(camp.start_datetime)}</span>
                      <span>🕒 {timeslot}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Scannable QR Code */}
                <div className="flex flex-col items-center justify-center bg-white p-3 rounded-2xl shadow-inner border border-stone-200">
                  <QRCodeCanvas
                    value={qrVerificationUrl}
                    size={120}
                    level="H"
                    includeMargin={false}
                    data-qr={donor?.donor_id}
                  />
                  <span className="text-[8px] font-mono font-bold text-stone-700 mt-2 uppercase tracking-wider text-center">
                    SCAN FOR DETAILS
                  </span>
                  <span className="text-[7px] font-mono text-stone-400 uppercase">
                    MOBILE SCAN READY
                  </span>
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-[9px] text-stone-400 font-mono relative z-10">
                <span className="text-stone-400">Non-Transferable • Verifiable on BloodChain</span>
                <span className="text-emerald-400">● SECURE TOKEN AUTH</span>
              </div>
            </div>

            {/* Action Buttons: Download, Print, Test Scan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                onClick={handleDownloadCard}
                disabled={downloading}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-semibold text-xs shadow-md shadow-rose-950/20 transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Generating PNG...' : 'Download Pass Card (PNG)'}
              </button>

              <button
                onClick={handlePrint}
                className="py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition flex items-center justify-center gap-2 border border-stone-800"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>

              <a
                href={localPreviewUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-stone-300"
              >
                <ExternalLink className="w-3.5 h-3.5 text-stone-600" />
                Preview Verification Page
              </a>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={onClose}
                className="text-xs font-semibold text-stone-500 hover:text-stone-800 underline transition"
              >
                Done & Return to Camp Finder
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                camp.urgency === 'CRITICAL' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}>
                {camp.camp_type || 'DONATION DRIVE'}
              </span>
              {camp.urgency === 'CRITICAL' && (
                <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> High Need
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-stone-900 mb-1">{camp.camp_name}</h3>
            
            {/* Organizer vs Venue Distinction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs">
              <div>
                <span className="text-stone-400 font-mono block uppercase text-[10px]">Organized By</span>
                <span className="font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-stone-500" />
                  {camp.organizer_name} ({camp.organizer_type === 'BLOOD_BANK' ? 'Blood Bank' : 'Hospital'})
                </span>
              </div>
              <div>
                <span className="text-stone-400 font-mono block uppercase text-[10px]">Camp Venue</span>
                <span className="font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="truncate">{camp.venue_name}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-stone-600 mb-6">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" /> {formatDate(camp.start_datetime)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" /> {formatTime(camp.start_datetime)} - {formatTime(camp.end_datetime)}
              </span>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase font-mono">
                  Select Preferred Arrival Time Slot
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {timeslots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeslot(slot)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition ${
                        timeslot === slot
                          ? 'bg-rose-50 border-rose-500 text-rose-900 font-semibold shadow-sm'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pre-donation Health Checklist */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-amber-900 uppercase font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> Pre-Donation Donor Readiness
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Before arriving: Ensure you are well hydrated, have had a light meal within 3 hours, weight is above 50kg, and have not taken antibiotics within 48 hours.
                </p>
                <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={healthChecked}
                    onChange={(e) => setHealthChecked(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-amber-300"
                  />
                  <span className="text-xs font-medium text-amber-950">
                    I confirm that I meet the basic physical donation conditions.
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-semibold text-xs transition shadow-md shadow-rose-900/20 disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
