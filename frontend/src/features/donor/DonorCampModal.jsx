import React, { useState } from 'react';
import api from '../../services/api';
import confetti from 'canvas-confetti';
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
  AlertCircle
} from 'lucide-react';

export const DonorCampModal = ({ camp, donor, onClose, onRegistered }) => {
  const [timeslot, setTimeslot] = useState('09:00 AM - 10:00 AM');
  const [notes, setNotes] = useState('');
  const [healthChecked, setHealthChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  if (!camp) return null;

  const timeslots = [
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 01:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM',
  ];

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
          particleCount: 80,
          spread: 70,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {successData ? (
          /* Success Screen */
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-bold text-stone-800">You Are Registered!</h3>
            <p className="text-sm text-stone-600 max-w-md mx-auto">
              Your donation slot has been secured. Your digital donor pass will be recognized at check-in.
            </p>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-stone-500">Camp:</span>
                <span className="font-bold text-stone-800 text-right">{camp.camp_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Venue:</span>
                <span className="text-stone-800 text-right">{camp.venue_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Date:</span>
                <span className="text-stone-800">{formatDate(camp.start_datetime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Selected Slot:</span>
                <span className="text-rose-700 font-bold">{timeslot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Donor ID:</span>
                <span className="text-stone-800 font-bold">{donor?.donor_id}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-stone-900 text-white font-semibold text-sm hover:bg-stone-800 transition"
              >
                Close & View Registrations
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
            
            {/* Organizer vs Venue Distinction as strictly specified */}
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
};
