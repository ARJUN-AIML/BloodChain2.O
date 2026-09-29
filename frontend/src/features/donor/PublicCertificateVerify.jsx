import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  ShieldCheck, 
  Award, 
  Droplet, 
  Calendar, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  FileCheck
} from 'lucide-react';

export const PublicCertificateVerify = ({ certificateId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyCert = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/camps/certificates/${certificateId}/public_verify/`);
        setData(res.data);
      } catch (err) {
        console.error('Public certificate verification failed:', err);
        setError('Certificate could not be verified. It may be invalid or not yet synced with the blockchain ledger.');
      } finally {
        setLoading(false);
      }
    };
    if (certificateId) {
      verifyCert();
    }
  }, [certificateId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-8 shadow-2xl border border-stone-200 text-center relative max-h-[92vh] overflow-y-auto my-auto">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700"
          >
            ✕
          </button>
        )}

        {loading ? (
          <div className="py-12 space-y-3">
            <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-500 font-mono">Verifying cryptographic signature on ledger...</p>
          </div>
        ) : error ? (
          <div className="py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Verification Failed</h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">{error}</p>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <div className="text-center pb-3 border-b border-stone-200">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                OFFICIALLY AUTHENTICATED
              </span>
              <h3 className="text-xl font-bold text-stone-900 mt-2">
                Verified Blood Donation Certificate
              </h3>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                Record ID: {data.certificate_id}
              </p>
            </div>

            <div className="space-y-2 text-xs bg-stone-50 p-4 rounded-2xl border border-stone-200/80 font-mono">
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Recipient Donor:</span>
                <strong className="text-stone-900">{data.donor_name}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Donor BloodChain ID:</span>
                <strong className="text-rose-700">{data.donor_id}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Blood Group:</span>
                <strong className="text-stone-900">{data.blood_group}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Donation Date:</span>
                <span className="text-stone-800">{data.donation_date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Host Facility:</span>
                <span className="text-stone-800">{data.facility_name}</span>
              </div>
              {data.camp_name && (
                <div className="flex justify-between py-1">
                  <span className="text-stone-500">Camp Drive:</span>
                  <span className="text-stone-800">{data.camp_name}</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Verified against BloodChain decentralized hospital inventory records.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
