import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Droplet, 
  Calendar, 
  Building2, 
  MapPin, 
  ShieldCheck, 
  Award, 
  FileCheck, 
  ChevronRight,
  Activity,
  Heart
} from 'lucide-react';

export const DonorDonations = ({ donor, onNavigateToCertificates }) => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setLoading(true);
        const res = await api.get('/donors/me/donations/');
        setDonations(res.data || []);
      } catch (err) {
        console.error('Failed to load donations history:', err);
        setError('Unable to load donation history.');
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, []);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-stone-300/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            Verified Medical Ledger
          </span>
          <h2 className="text-2xl font-bold text-stone-900 mt-1">Donation History</h2>
          <p className="text-sm text-stone-600">
            Every entry represents an officially verified transfusion unit recorded across the network.
          </p>
        </div>

        {/* Total Summary */}
        <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200 self-start sm:self-auto">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
            <Droplet className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="text-xl font-bold text-stone-900">{donor?.verified_donation_count || donations.length}</div>
            <div className="text-[10px] font-mono text-stone-500 uppercase">Verified Units</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-stone-400 font-mono text-sm">
          Loading verified donation ledger...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
          {error}
        </div>
      ) : donations.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-300/80 shadow-sm space-y-3">
          <Heart className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-700">No Verified Donations Recorded Yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Once you donate at any participating BloodChain hospital or camp, the medical staff will verify your donation and issue an official certificate.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {donations.map((item, index) => (
            <div
              key={item.donation_id || index}
              className="bg-white rounded-2xl p-6 border border-stone-300/80 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Left Info */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex flex-col items-center justify-center shrink-0">
                  <span className="text-base font-black leading-none">{item.blood_group || donor?.blood_group}</span>
                  <span className="text-[9px] font-mono mt-0.5">TYPE</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {item.donation_id}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Staff Verified
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 pt-0.5">
                    {item.facility_name || 'BloodChain Medical Center'}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                    {item.camp_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" /> Camp: {item.camp_name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" /> {formatDate(item.donation_datetime)}
                    </span>
                    <span className="font-mono text-stone-600">
                      Units: <strong>{item.units_donated || 1.0} unit</strong>
                    </span>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-stone-500 italic pt-1">
                      "{item.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Right Action */}
              <div className="flex items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 shrink-0">
                <button
                  onClick={onNavigateToCertificates}
                  className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  <FileCheck className="w-4 h-4 text-amber-400" /> View Certificate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
