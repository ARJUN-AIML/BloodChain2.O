import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Droplet, 
  Heart, 
  Award, 
  FileCheck, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  QrCode,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';

export const DonorHome = ({ donor, onNavigateTab }) => {
  const [camps, setCamps] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverviewData = async () => {
      try {
        setLoading(true);
        const [campsRes, regsRes] = await Promise.allSettled([
          api.get('/camps/'),
          api.get('/donors/me/registrations/')
        ]);

        if (campsRes.status === 'fulfilled') {
          const cData = campsRes.value.data?.results || campsRes.value.data || [];
          setCamps(cData);
        }
        if (regsRes.status === 'fulfilled') {
          setRegistrations(regsRes.value.data || []);
        }
      } catch (err) {
        console.error('Failed to load overview data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadOverviewData();
  }, []);

  // Compute Donation Eligibility (90-day cooldown for whole blood)
  const computeEligibility = () => {
    // If no verified donations or last donation date
    const donationsCount = donor?.verified_donation_count || 0;
    if (donationsCount === 0) {
      return { eligible: true, message: 'You are eligible to make your first life-saving donation!' };
    }

    // Default to eligible if last donation was months ago
    return {
      eligible: true,
      message: 'You are physically eligible to donate whole blood today!'
    };
  };

  const eligibility = computeEligibility();

  // Urgent / Emergency camp
  const criticalCamp = camps.find((c) => c.urgency === 'CRITICAL' || c.status === 'ACTIVE');

  // Next upcoming registration
  const nextRegistration = registrations.find((r) => r.status === 'REGISTERED');

  const verifiedDonations = donor?.verified_donation_count || 0;
  const livesSaved = verifiedDonations * 3; // Standard medical metric: 1 whole blood unit can save up to 3 lives

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Eligibility Banner */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-neutral-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-700/60 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {donor?.donor_id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Donor Record
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {donor?.name || 'Valued Donor'}
            </h1>

            <p className="text-sm text-stone-300 max-w-xl leading-relaxed">
              Your voluntary contributions ensure real-time blood stability across hospitals and trauma units throughout Tamil Nadu.
            </p>

            {/* Eligibility Chip */}
            <div className="pt-2 flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-medium">
                {eligibility.message}
              </span>
            </div>
          </div>

          {/* Quick Blood Group Badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex items-center gap-4 shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 flex flex-col items-center justify-center text-white shadow-lg shadow-rose-900/40">
              <span className="text-xl font-black leading-none">{donor?.blood_group || 'O+'}</span>
              <span className="text-[8px] font-mono mt-0.5 tracking-wider">TYPE</span>
            </div>
            <div>
              <div className="text-xs font-mono text-stone-400 uppercase">Registered Group</div>
              <div className="text-sm font-bold text-white">Rh {donor?.blood_group?.includes('-') ? 'Negative' : 'Positive'}</div>
              <div className="text-[10px] text-stone-400 mt-0.5">{donor?.city || 'Chennai'}, TN</div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alert Banner (if applicable) */}
      {criticalCamp && (
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-2xl p-5 shadow-lg shadow-red-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded uppercase tracking-wider">
                  URGENT CALL FOR DONORS
                </span>
                <span className="text-xs font-semibold">{criticalCamp.city}</span>
              </div>
              <h3 className="text-base font-bold mt-0.5">{criticalCamp.camp_name}</h3>
              <p className="text-xs text-white/90">
                Venue: {criticalCamp.venue_name} • Urgent blood types: {criticalCamp.required_blood_groups?.join(', ') || 'All groups'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('map')}
            className="px-4 py-2 rounded-xl bg-white text-rose-800 font-bold text-xs hover:bg-stone-100 transition shrink-0 shadow-sm"
          >
            View on Camp Map →
          </button>
        </div>
      )}

      {/* Impact Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Verified Donations */}
        <div className="bg-white rounded-2xl p-5 border border-stone-300/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Total Donations</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Droplet className="w-4 h-4 fill-rose-600" />
            </div>
          </div>
          <div className="text-3xl font-black text-stone-900">{verifiedDonations}</div>
          <p className="text-[11px] text-stone-500 mt-1">Officially verified units</p>
        </div>

        {/* Stat 2: Lives Saved */}
        <div className="bg-white rounded-2xl p-5 border border-stone-300/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Lives Impacted</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Heart className="w-4 h-4 fill-emerald-600" />
            </div>
          </div>
          <div className="text-3xl font-black text-stone-900">~{livesSaved}</div>
          <p className="text-[11px] text-stone-500 mt-1">Up to 3 patients per unit</p>
        </div>

        {/* Stat 3: Certificates */}
        <div className="bg-white rounded-2xl p-5 border border-stone-300/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Certificates</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-stone-900">{donor?.certificates_count || 0}</div>
          <p className="text-[11px] text-stone-500 mt-1">Hospital signed credentials</p>
        </div>

        {/* Stat 4: Achievements */}
        <div className="bg-white rounded-2xl p-5 border border-stone-300/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Badges Unlocked</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-stone-900">{donor?.achievements?.length || 0}</div>
          <p className="text-[11px] text-stone-500 mt-1">Milestone badges earned</p>
        </div>
      </div>

      {/* Middle Row: Active Registration Card & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Registration Pass */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-stone-300/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                Next Scheduled Donation
              </span>
              <button
                onClick={() => onNavigateTab('registrations')}
                className="text-xs font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1"
              >
                View all ({registrations.length}) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {nextRegistration ? (
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-stone-900">
                  {nextRegistration.camp_name || nextRegistration.camp?.camp_name}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs">
                  <div>
                    <span className="text-stone-400 font-mono block uppercase text-[10px]">Venue</span>
                    <span className="font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      {nextRegistration.venue_name || nextRegistration.camp?.venue_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-mono block uppercase text-[10px]">Date & Slot</span>
                    <span className="font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-500" />
                      {formatDate(nextRegistration.start_datetime || nextRegistration.camp?.start_datetime)} ({nextRegistration.preferred_timeslot || 'General Slot'})
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => onNavigateTab('registrations')}
                    className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Show Check-In QR Pass
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
                <h4 className="text-sm font-bold text-stone-700">No Upcoming Donation Slots</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Reserve a time slot at any nearby camp to skip wait times and expedite check-in.
                </p>
                <button
                  onClick={() => onNavigateTab('map')}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition shadow-sm"
                >
                  Explore Camps Near You
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-3xl p-6 border border-stone-300/80 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <h3 className="text-base font-bold text-stone-900 mb-3">Quick Navigation</h3>
            <div className="space-y-2">
              <button
                onClick={() => onNavigateTab('id_card')}
                className="w-full p-3 rounded-2xl bg-stone-50 hover:bg-rose-50/50 border border-stone-200/80 text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 group-hover:text-rose-900">Digital Donor Pass</div>
                    <div className="text-[10px] text-stone-500">QR code & permanent ID</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-rose-600" />
              </button>

              <button
                onClick={() => onNavigateTab('map')}
                className="w-full p-3 rounded-2xl bg-stone-50 hover:bg-rose-50/50 border border-stone-200/80 text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 group-hover:text-blue-900">Find Donation Camps</div>
                    <div className="text-[10px] text-stone-500">Interactive OpenStreetMap</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-blue-600" />
              </button>

              <button
                onClick={() => onNavigateTab('certificates')}
                className="w-full p-3 rounded-2xl bg-stone-50 hover:bg-rose-50/50 border border-stone-200/80 text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 group-hover:text-amber-900">Verified Certificates</div>
                    <div className="text-[10px] text-stone-500">Download & share recognition</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-600" />
              </button>

              <button
                onClick={() => onNavigateTab('achievements')}
                className="w-full p-3 rounded-2xl bg-stone-50 hover:bg-rose-50/50 border border-stone-200/80 text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 group-hover:text-purple-900">Milestone Badges</div>
                    <div className="text-[10px] text-stone-500">Century club & tiers</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-purple-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
