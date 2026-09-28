import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import { 
  Award, 
  FileCheck, 
  Calendar, 
  Building2, 
  MapPin, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  ShieldCheck, 
  Droplet,
  Sparkles
} from 'lucide-react';

export const DonorCertificates = ({ donor }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCert, setSelectedCert] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/donors/me/certificates/');
      setCertificates(res.data || []);
    } catch (err) {
      console.error('Failed to load certificates:', err);
      setError('Unable to load donation certificates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleCopyLink = (certId) => {
    const url = `${window.location.origin}/verify/certificate/${certId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(certId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-stone-300/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 w-max">
            <Award className="w-3.5 h-3.5" /> Official Recognition
          </span>
          <h2 className="text-2xl font-bold text-stone-900 mt-1">Verified Donation Certificates</h2>
          <p className="text-sm text-stone-600">
            Cryptographically signed proof of voluntary blood donation, issued directly by authorized facilities.
          </p>
        </div>

        <div className="text-right self-start sm:self-auto font-mono text-xs text-stone-500">
          Total Issued: <strong className="text-stone-900 text-lg">{certificates.length}</strong>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-stone-400 font-mono text-sm">
          Loading certificate credentials...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
          {error}
        </div>
      ) : certificates.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-300/80 shadow-sm space-y-3">
          <Award className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-700">No Certificates Available Yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Certificates are automatically generated and signed immediately following a verified blood donation at any network facility.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.certificate_id}
              className="bg-gradient-to-b from-amber-50/50 via-white to-stone-50 rounded-3xl p-6 border-2 border-amber-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 relative overflow-hidden group"
            >
              {/* Subtle Corner Ornament */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-400/10 rounded-bl-3xl pointer-events-none" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    {cert.certificate_id}
                  </span>
                  <span className="text-xs font-black text-rose-600 font-mono">
                    {donor?.blood_group || 'O+'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-stone-900 leading-snug">
                    Certificate of Appreciation
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">Presented to <strong>{donor?.name}</strong></p>
                </div>

                <div className="space-y-1 text-xs text-stone-600 bg-white/80 p-3 rounded-xl border border-stone-200/70">
                  <div className="flex items-center gap-1.5 text-stone-500">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{cert.facility_name}</span>
                  </div>
                  {cert.camp_name && (
                    <div className="flex items-center gap-1.5 text-stone-500">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{cert.camp_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-stone-500">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatDate(cert.donation_date)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedCert(cert)}
                  className="flex-1 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <FileCheck className="w-3.5 h-3.5 text-amber-400" /> View Formal Certificate
                </button>
                <button
                  onClick={() => handleCopyLink(cert.certificate_id)}
                  className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition border border-stone-200"
                  title="Copy verification link"
                >
                  {copiedId === cert.certificate_id ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formal Certificate Modal */}
      {selectedCert && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-stone-950/60 backdrop-blur-md animate-fade-in overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedCert(null);
          }}
        >
          <div className="max-w-2xl w-full my-auto bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border-4 border-amber-300 relative text-center">
            {/* Modal Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                title="Print Certificate"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedCert(null)}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formal Certificate Content */}
            <div className="border-2 border-stone-300 p-6 sm:p-8 rounded-2xl bg-[#faf7f2] relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 text-white mx-auto flex items-center justify-center shadow-md mb-3">
                <Droplet className="w-6 h-6 fill-white" />
              </div>

              <span className="text-[10px] font-mono tracking-widest text-stone-500 uppercase">
                BloodChain Certified Medical Record
              </span>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
                Certificate of Appreciation
              </h1>

              <p className="text-xs text-stone-500 font-serif italic mt-1">
                This honor is gratefully conferred upon
              </p>

              <h2 className="text-xl sm:text-2xl font-bold text-rose-800 my-3 font-serif underline decoration-amber-400 decoration-2 underline-offset-4">
                {donor?.name}
              </h2>

              <p className="text-xs text-stone-700 max-w-lg mx-auto leading-relaxed">
                in profound appreciation for the voluntary gift of blood, which sustains life and provides critical hope to medical patients across Tamil Nadu.
              </p>

              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 p-3 bg-white/80 rounded-xl border border-stone-200 text-xs text-stone-700 font-mono">
                <div>
                  <span className="text-[9px] text-stone-400 block uppercase">Blood Type</span>
                  <strong className="text-rose-700 text-sm">{donor?.blood_group || 'O+'}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-stone-400 block uppercase">Donor ID</span>
                  <strong>{donor?.donor_id}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-stone-400 block uppercase">Date</span>
                  <strong>{formatDate(selectedCert.donation_date)}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-stone-400 block uppercase">Cert ID</span>
                  <strong className="text-[10px]">{selectedCert.certificate_id}</strong>
                </div>
              </div>

              {/* Signatures & QR Section */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-stone-300">
                <div className="text-left text-xs text-stone-600">
                  <div className="font-bold text-stone-800">{selectedCert.facility_name}</div>
                  <div className="text-[11px] text-stone-500">{selectedCert.camp_name || 'Hospital Center'}</div>
                  <div className="text-[9px] font-mono text-emerald-600 font-semibold mt-1">
                    ✓ Cryptographically Signed & Verified
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-stone-200">
                  <QRCodeSVG
                    value={`${window.location.origin}/verify/certificate/${selectedCert.certificate_id}`}
                    size={64}
                    level="M"
                  />
                  <div className="text-left text-[9px] font-mono text-stone-500">
                    <span className="font-bold block text-stone-700 uppercase">Public Verify</span>
                    <span>Scan to validate authenticity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
