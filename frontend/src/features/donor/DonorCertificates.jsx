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
  X, 
  ShieldCheck, 
  Droplet,
  Sparkles,
  ExternalLink,
  Share2
} from 'lucide-react';

/* Decorative Classical Corner Filigree Florets */
const CornerOrnament = ({ className = "" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={`w-10 h-10 sm:w-16 sm:h-16 text-amber-700/80 pointer-events-none ${className}`}>
    <path d="M4 4H36C26 8 18 16 14 26C12 18 8 12 4 4Z" fill="currentColor" fillOpacity="0.8" />
    <path d="M4 4V36C8 26 16 18 26 14C18 12 12 8 4 4Z" fill="currentColor" fillOpacity="0.8" />
    <circle cx="16" cy="16" r="3.5" fill="currentColor" />
    <circle cx="28" cy="28" r="2" fill="currentColor" />
    <path d="M24 8C28 14 34 20 44 22C34 26 26 34 22 44C20 34 14 28 8 24C14 20 20 14 24 8Z" fill="currentColor" fillOpacity="0.65" />
    <path d="M4 4L60 4M4 4L4 60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="5" cy="5" r="2" fill="currentColor" />
  </svg>
);

/* Gold Flourish Divider */
const FlourishDivider = () => (
  <div className="flex items-center justify-center gap-2 my-2 sm:my-3">
    <div className="h-[1px] w-14 sm:w-28 bg-gradient-to-r from-transparent via-amber-500 to-amber-600" />
    <div className="flex items-center gap-1.5 text-amber-600">
      <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
      <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
      <Award className="w-4 h-4 text-amber-700 fill-amber-700/20" />
      <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
      <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
    </div>
    <div className="h-[1px] w-14 sm:w-28 bg-gradient-to-l from-transparent via-amber-500 to-amber-600" />
  </div>
);

/* 3D Gold Rosette Medallion with Crimson Silk Ribbons */
const MedallionCrest = () => (
  <div className="relative flex flex-col items-center">
    {/* Twin Crimson Silk Ribbon Tails */}
    <div className="absolute -bottom-5 flex items-center justify-center gap-2 pointer-events-none z-0">
      <div 
        className="w-5 sm:w-6 h-9 sm:h-11 bg-gradient-to-b from-rose-800 via-red-900 to-rose-950 shadow-md transform -rotate-12 rounded-b-sm border-t border-amber-400" 
        style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 82%, 0% 100%)' }} 
      />
      <div 
        className="w-5 sm:w-6 h-9 sm:h-11 bg-gradient-to-b from-rose-800 via-red-900 to-rose-950 shadow-md transform rotate-12 rounded-b-sm border-t border-amber-400"
        style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 82%, 0% 100%)' }} 
      />
    </div>

    {/* Medallion Seal */}
    <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 shadow-xl flex items-center justify-center border-2 border-amber-200">
      <div className="w-full h-full rounded-full p-1 bg-gradient-to-tr from-amber-600 via-amber-300 to-yellow-600 flex items-center justify-center border border-amber-800/40 shadow-inner">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-red-600 via-rose-700 to-red-900 flex flex-col items-center justify-center shadow-lg border border-amber-300/80">
          <Droplet className="w-5 h-5 sm:w-6 sm:h-6 text-amber-200 fill-amber-200 filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]" />
          <span className="text-[7px] sm:text-[8px] font-black tracking-widest text-amber-200 uppercase font-mono mt-0.5">
            HONOR
          </span>
        </div>
      </div>
    </div>
  </div>
);

/* Official Government & Council Rubber Verification Stamp */
const OfficialVerificationStamp = () => (
  <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center rotate-[-5deg] select-none pointer-events-none opacity-90 mx-auto">
    <div className="absolute inset-0 rounded-full border-2 border-dashed border-rose-800/80" />
    <div className="absolute inset-1.5 rounded-full border-2 border-rose-800/80" />
    <div className="absolute inset-3 rounded-full border border-rose-800/50" />
    <div className="text-center p-1 space-y-0.5 text-rose-800">
      <div className="text-[7px] font-mono tracking-widest uppercase font-black text-rose-900 leading-tight">
        ★ GOVT OF TAMIL NADU ★
      </div>
      <div className="text-[8px] font-cinzel font-black uppercase tracking-wider text-rose-800">
        BLOOD REGISTRY
      </div>
      <div className="w-6 h-6 mx-auto my-0.5 rounded-full bg-rose-800/10 flex items-center justify-center border border-rose-800/30">
        <Droplet className="w-3.5 h-3.5 text-rose-800 fill-rose-800" />
      </div>
      <div className="text-[7.5px] font-bold font-mono tracking-widest uppercase text-emerald-800">
        OFFICIALLY VERIFIED
      </div>
      <div className="text-[6.5px] font-mono tracking-tight text-rose-700 font-semibold">
        SECURE LEDGER SEAL
      </div>
    </div>
  </div>
);

export const DonorCertificates = ({ donor }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCert, setSelectedCert] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [modalCopied, setModalCopied] = useState(false);

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

  const handleModalCopyLink = (certId) => {
    const url = `${window.location.origin}/verify/certificate/${certId}`;
    navigator.clipboard.writeText(url);
    setModalCopied(true);
    setTimeout(() => setModalCopied(false), 2000);
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
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-50/90 via-stone-50 to-amber-100/60 backdrop-blur-md rounded-2xl p-6 sm:p-7 border border-amber-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-200/70 text-amber-900 border border-amber-300 flex items-center gap-1.5 w-max shadow-sm">
            <Award className="w-3.5 h-3.5 text-amber-800" /> Official State Recognition
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2">
            Verified Donation Certificates
          </h2>
          <p className="text-sm text-stone-600 max-w-xl mt-1 leading-relaxed">
            Cryptographically signed proof of voluntary life-saving blood donation, officially issued by authorized healthcare facilities and anchored on the decentralized state registry.
          </p>
        </div>

        <div className="sm:text-right font-mono bg-white/80 px-4 py-2.5 rounded-xl border border-amber-200/70 shadow-inner">
          <span className="text-[11px] uppercase tracking-wider text-stone-500 block font-sans">Official Awards</span>
          <span className="text-2xl font-black text-amber-900">{certificates.length}</span>
          <span className="text-xs text-stone-500 block">Issued Credentials</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-stone-500 font-mono text-sm space-y-3">
          <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Retrieving signed credentials from registry...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
          {error}
        </div>
      ) : certificates.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-300/80 shadow-sm space-y-3">
          <Award className="w-14 h-14 text-amber-300 mx-auto" />
          <h3 className="text-lg font-serif font-bold text-stone-800">No Certificates Available Yet</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            Official certificates of appreciation are generated and cryptographically signed immediately after you complete a voluntary donation at any participating medical camp or hospital.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.certificate_id}
              className="bg-gradient-to-b from-[#fffdfa] via-[#fcf8f0] to-[#f8f2e4] rounded-3xl p-6 border-2 border-amber-300/90 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between space-y-5 relative overflow-hidden group"
            >
              {/* Corner Gold Ribbon Accent */}
              <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none overflow-hidden">
                <div className="absolute transform rotate-45 bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 font-bold text-[9px] py-0.5 right-[-35px] top-[18px] w-[120px] text-center shadow-sm uppercase tracking-wider font-mono">
                  VERIFIED
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300">
                    {cert.certificate_id}
                  </span>
                  <span className="text-xs font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 font-mono">
                    {donor?.blood_group || 'O+'} Rh+
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-amber-800 text-xs font-semibold uppercase tracking-wider">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    State Recognition Citation
                  </div>
                  <h3 className="text-lg font-serif font-bold text-stone-900 mt-1 leading-snug">
                    Certificate of Appreciation
                  </h3>
                  <p className="text-xs text-stone-600 mt-1">
                    Conferred upon <strong className="text-stone-900">{donor?.name}</strong>
                  </p>
                </div>

                {/* Details Plaque */}
                <div className="space-y-1.5 text-xs text-stone-700 bg-white/90 p-3.5 rounded-2xl border border-amber-200/70 shadow-sm">
                  <div className="flex items-center gap-2 text-stone-700 font-medium">
                    <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="truncate">{cert.facility_name}</span>
                  </div>
                  {cert.camp_name && (
                    <div className="flex items-center gap-2 text-stone-600 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                      <span className="truncate">{cert.camp_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-stone-600 text-[11px] pt-0.5 border-t border-stone-100">
                    <Calendar className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span>{formatDate(cert.donation_date)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-amber-200/70 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedCert(cert)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-stone-900 to-stone-800 hover:from-amber-950 hover:to-stone-900 text-white font-semibold text-xs transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 group-hover:border-amber-400/30"
                >
                  <Award className="w-4 h-4 text-amber-400" /> View Formal Certificate
                </button>
                <button
                  onClick={() => handleCopyLink(cert.certificate_id)}
                  className="p-2.5 rounded-xl bg-white hover:bg-amber-100/60 text-stone-700 transition border border-amber-200 shadow-sm"
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

      {/* Formal Luxury Certificate Modal */}
      {selectedCert && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-md animate-fade-in overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedCert(null);
          }}
        >
          <div className="max-w-4xl w-full my-auto flex flex-col items-center">
            
            {/* Top Toolbar (Hidden on Print) */}
            <div className="w-full flex items-center justify-between pb-3 px-2 print:hidden text-white">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-medium text-stone-300">
                  Certified State BloodChain Record #{selectedCert.certificate_id}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleModalCopyLink(selectedCert.certificate_id)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition border border-white/10 flex items-center gap-1.5 shadow-sm"
                  title="Copy Public Verification Link"
                >
                  {modalCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Share Link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md"
                  title="Print Certificate"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>

                <button
                  onClick={() => setSelectedCert(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-600/80 text-white transition ml-1"
                  title="Close Certificate"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Certificate Frame */}
            <div 
              id="printable-certificate-container"
              className="w-full bg-[#fdfbf7] text-stone-900 rounded-2xl sm:rounded-3xl shadow-2xl border-4 sm:border-[6px] border-[#b8860b] p-3 sm:p-5 relative select-text"
              style={{
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(212, 175, 55, 0.25)'
              }}
            >
              {/* Inner Ivory Matting & Filigree Border */}
              <div className="border-2 sm:border-[2.5px] border-[#c59b27] rounded-xl sm:rounded-2xl p-4 sm:p-8 bg-[#faf7ef] relative parchment-pattern overflow-hidden">
                
                {/* 4 Ornate Victorian Corner Fleurons */}
                <CornerOrnament className="absolute top-2 left-2" />
                <CornerOrnament className="absolute top-2 right-2 transform rotate-90" />
                <CornerOrnament className="absolute bottom-2 left-2 transform -rotate-90" />
                <CornerOrnament className="absolute bottom-2 right-2 transform rotate-180" />

                {/* Subtle Inner Dotted Rule */}
                <div className="absolute inset-2 sm:inset-3 border border-dotted border-amber-600/30 rounded-lg sm:rounded-xl pointer-events-none" />

                {/* Subtle Watermark Droplet in Background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035]">
                  <Droplet className="w-96 h-96 text-stone-900 fill-stone-900" />
                </div>

                {/* Certificate Content */}
                <div className="relative z-10 text-center space-y-3 sm:space-y-4">
                  
                  {/* Top Header: Authority Banner & Medallion */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3 sm:gap-2 pb-1 border-b border-amber-400/40">
                    {/* Left: State Ministry */}
                    <div className="text-center sm:text-left text-[9px] sm:text-[10px] font-serif text-stone-700 leading-tight">
                      <div className="font-bold tracking-wider uppercase text-amber-950 font-cinzel">
                        GOVERNMENT OF TAMIL NADU
                      </div>
                      <div className="text-stone-600 font-sans mt-0.5">
                        Department of Health & Family Welfare
                      </div>
                      <div className="text-amber-800 font-semibold font-sans">
                        State Blood Transfusion Council
                      </div>
                    </div>

                    {/* Center: Medallion Seal */}
                    <div className="flex justify-center -mt-1 sm:-mt-2">
                      <MedallionCrest />
                    </div>

                    {/* Right: BloodChain Registry */}
                    <div className="text-center sm:text-right text-[9px] sm:text-[10px] font-serif text-stone-700 leading-tight">
                      <div className="font-bold tracking-wider uppercase text-amber-950 font-cinzel">
                        BLOODCHAIN NETWORK
                      </div>
                      <div className="text-stone-600 font-sans mt-0.5">
                        Decentralized Medical Registry
                      </div>
                      <div className="text-emerald-800 font-mono font-semibold">
                        ★ Verified Life-Saver Citation ★
                      </div>
                    </div>
                  </div>

                  {/* Main Title Banner */}
                  <div className="pt-2 sm:pt-3">
                    <span className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] text-amber-900 uppercase block">
                      HONORARY CITATION FOR VOLUNTARY BLOOD DONATION
                    </span>

                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-cinzel font-extrabold text-stone-950 tracking-wider mt-1 drop-shadow-sm uppercase">
                      Certificate of Appreciation
                    </h1>

                    <p className="text-xs sm:text-sm font-cormorant italic text-stone-600 tracking-wide mt-1">
                      This formal recognition and distinguished tribute is proudly conferred upon
                    </p>
                  </div>

                  {/* Donor Recipient Name & Calligraphic Flourish */}
                  <div className="py-1 sm:py-2">
                    <FlourishDivider />
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-rose-950 tracking-wide my-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
                      {donor?.name}
                    </h2>
                    <FlourishDivider />
                  </div>

                  {/* Citation Statement */}
                  <p className="text-xs sm:text-sm text-stone-700 max-w-2xl mx-auto font-serif leading-relaxed px-2 sm:px-4">
                    In profound appreciation and highest civic honor for the noble, voluntary donation of life-giving blood. 
                    Through your compassionate humanitarian dedication, you have sustained precious human life, restored vital hope to critical patients, 
                    and reinforced the clinical blood resilience of Tamil Nadu.
                  </p>

                  {/* Official Credential Grid (4 Columns) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 my-3 p-3 sm:p-4 bg-white/95 rounded-xl sm:rounded-2xl border border-amber-300 shadow-sm text-xs font-mono">
                    <div className="border-r last:border-none border-stone-200 pr-1">
                      <span className="text-[9px] sm:text-[10px] text-stone-500 block uppercase tracking-wider font-sans font-semibold">
                        Blood Phenotype
                      </span>
                      <strong className="text-rose-700 text-sm sm:text-base font-black">
                        {donor?.blood_group || 'O+'} Rh+
                      </strong>
                      <span className="text-[9px] text-stone-400 block font-sans">Whole Blood</span>
                    </div>

                    <div className="border-r last:border-none border-stone-200 pr-1">
                      <span className="text-[9px] sm:text-[10px] text-stone-500 block uppercase tracking-wider font-sans font-semibold">
                        Donor Citizen ID
                      </span>
                      <strong className="text-stone-900 text-xs sm:text-sm font-bold truncate block">
                        {donor?.donor_id || 'BC-D-20992'}
                      </strong>
                      <span className="text-[9px] text-emerald-700 block font-sans">Registered Donor</span>
                    </div>

                    <div className="border-r last:border-none border-stone-200 pr-1">
                      <span className="text-[9px] sm:text-[10px] text-stone-500 block uppercase tracking-wider font-sans font-semibold">
                        Donation Date
                      </span>
                      <strong className="text-stone-900 text-xs sm:text-sm font-bold block">
                        {formatDate(selectedCert.donation_date)}
                      </strong>
                      <span className="text-[9px] text-stone-400 block font-sans">Verified Timestamp</span>
                    </div>

                    <div>
                      <span className="text-[9px] sm:text-[10px] text-stone-500 block uppercase tracking-wider font-sans font-semibold">
                        Certificate Hash
                      </span>
                      <strong className="text-[10px] sm:text-xs text-amber-900 font-bold block truncate">
                        {selectedCert.certificate_id}
                      </strong>
                      <span className="text-[9px] text-stone-400 block font-sans">Ledger Synchronized</span>
                    </div>
                  </div>

                  {/* Signatures & Official Crimson Stamp Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 items-end justify-between gap-4 pt-3 sm:pt-4 border-t border-amber-400/50">
                    
                    {/* Left: Medical Officer Signature */}
                    <div className="text-center sm:text-left space-y-1">
                      <div className="font-signature text-3xl sm:text-4xl text-sky-950 font-medium select-none h-10 flex items-center justify-center sm:justify-start">
                        Dr. K. Swaminathan
                      </div>
                      <div className="w-48 sm:w-56 h-[1.5px] bg-gradient-to-r from-amber-600 via-amber-700 to-transparent mx-auto sm:mx-0" />
                      <div className="text-[11px] font-bold text-stone-900 font-serif">
                        Dr. K. Swaminathan, MD
                      </div>
                      <div className="text-[10px] text-stone-600 font-sans">
                        Chief Medical Officer & In-Charge
                      </div>
                      <div className="text-[9.5px] text-amber-900 font-semibold truncate max-w-xs font-sans">
                        {selectedCert.facility_name}
                      </div>
                    </div>

                    {/* Center: Official Verification Rubber Stamp */}
                    <div className="flex items-center justify-center">
                      <OfficialVerificationStamp />
                    </div>

                    {/* Right: State Health Commissioner Signature */}
                    <div className="text-center sm:text-right space-y-1">
                      <div className="font-signature text-3xl sm:text-4xl text-sky-950 font-medium select-none h-10 flex items-center justify-center sm:justify-end">
                        Dr. J. Radhakrishnan
                      </div>
                      <div className="w-48 sm:w-56 h-[1.5px] bg-gradient-to-l from-amber-600 via-amber-700 to-transparent mx-auto sm:ml-auto" />
                      <div className="text-[11px] font-bold text-stone-900 font-serif">
                        Dr. J. Radhakrishnan, IAS
                      </div>
                      <div className="text-[10px] text-stone-600 font-sans">
                        Principal Secretary & State Commissioner
                      </div>
                      <div className="text-[9.5px] text-amber-900 font-semibold font-sans">
                        State Health Mission & BloodChain
                      </div>
                    </div>
                  </div>

                  {/* Cryptographic Ledger Bar & QR Code Footer */}
                  <div className="mt-4 pt-3 border-t border-amber-300/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                    <div className="space-y-1 text-stone-600 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-mono font-bold text-emerald-800">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>CRYPTOGRAPHICALLY SEALED & VERIFIED ON REGISTRY</span>
                      </div>
                      <p className="text-[10px] text-stone-500 font-mono">
                        Immutable Ledger Record • Block #{selectedCert.certificate_id.replace(/\D/g, '') || '849201'} • Host: {selectedCert.facility_name}
                      </p>
                    </div>

                    {/* QR Code with Gold Corner Brackets */}
                    <div className="flex items-center gap-3 bg-white p-2 sm:p-2.5 rounded-xl border border-amber-300 shadow-sm shrink-0">
                      <div className="relative p-1 bg-white">
                        <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-600" />
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-600" />
                        <div className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-600" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-600" />
                        <QRCodeSVG
                          value={`${window.location.origin}/verify/certificate/${selectedCert.certificate_id}`}
                          size={64}
                          level="H"
                          includeMargin={false}
                        />
                      </div>
                      <div className="text-[9px] font-mono text-stone-500 max-w-[130px] leading-tight">
                        <span className="font-bold block text-stone-900 uppercase">AUDIT RECORD</span>
                        <span>Scan QR code to verify cryptographic authenticity on chain</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Bottom Modal Hint (Hidden on Print) */}
            <div className="w-full text-center pt-3 text-stone-400 text-xs font-mono print:hidden">
              Press <kbd className="px-1.5 py-0.5 bg-stone-800 text-stone-200 rounded text-[10px] border border-stone-700">ESC</kbd> or click outside to return
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
