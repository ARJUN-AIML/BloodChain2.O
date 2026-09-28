import React, { useState } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { downloadDonorPassCard } from './cardDownloadUtil';
import { getVerificationQrUrl, getLocalVerificationUrl } from './qrUrlUtil';
import { 
  ShieldCheck, 
  Droplet, 
  Calendar, 
  MapPin, 
  QrCode, 
  Copy, 
  Check, 
  Printer, 
  Sparkles,
  Download,
  ExternalLink,
  Info,
  HeartHandshake
} from 'lucide-react';

export const DonorIdCard = ({ donor }) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!donor) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(donor.donor_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyUrl = getVerificationQrUrl(donor.qr_token || donor.donor_id);
  const localPreviewUrl = getLocalVerificationUrl(donor.qr_token || donor.donor_id);

  const handleCopyVerifyUrl = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadCard = async () => {
    try {
      setDownloading(true);
      await downloadDonorPassCard({
        donor,
        camp: {
          camp_name: 'BloodChain Regional Network',
          venue_name: `${donor.city || 'Chennai'}, ${donor.state || 'Tamil Nadu'}`
        },
        timeslot: 'Permanent Lifetime Pass',
        qrValue: verifyUrl
      });
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-stone-300/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Official Digital Pass
            </span>
            <span className="text-xs text-stone-500 font-mono">Blockchain Verified</span>
          </div>
          <h2 className="text-2xl font-bold text-stone-800">Permanent BloodChain Donor ID</h2>
          <p className="text-sm text-stone-600">
            Valid across all participating hospitals, blood banks, and verified mobile donation camps in the network.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyId}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition border border-stone-300"
            title="Copy Permanent Donor ID"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied ID' : 'Copy ID'}
          </button>

          <button
            onClick={handleDownloadCard}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 rounded-xl transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? 'Downloading...' : 'Download Card (PNG)'}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-stone-800 hover:bg-stone-900 rounded-xl transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" /> Print Card
          </button>
        </div>
      </div>

      {/* The Physical Card Simulation */}
      <div className="flex justify-center p-2 sm:p-6">
        <div 
          id="printable-donor-card"
          className="w-full max-w-md bg-gradient-to-br from-stone-900 via-stone-850 to-neutral-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-700/60 relative overflow-hidden transition-all duration-300 hover:shadow-rose-950/20 hover:border-rose-900/40"
        >
          {/* Subtle Background Watermark Hologram */}
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

          {/* Top Bar: Brand & Chip */}
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-4 mb-6 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center shadow-lg shadow-rose-900/30">
                <Droplet className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <span className="font-extrabold tracking-tight text-base text-stone-100 flex items-center gap-1.5">
                  BloodChain <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">DONOR PASS</span>
                </span>
                <p className="text-[10px] text-stone-400 font-mono tracking-widest uppercase">Decentralized Blood Network</p>
              </div>
            </div>

            {/* Smart Chip Graphic */}
            <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-yellow-400 border border-amber-400/80 shadow-sm flex items-center justify-center relative overflow-hidden">
              <div className="w-full h-[1px] bg-amber-600/40 absolute top-2" />
              <div className="w-full h-[1px] bg-amber-600/40 absolute bottom-2" />
              <div className="h-full w-[1px] bg-amber-600/40 absolute left-3" />
              <div className="h-full w-[1px] bg-amber-600/40 absolute right-3" />
            </div>
          </div>

          {/* Center Card Content: Donor Details & QR Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center relative z-10">
            {/* Left 2 Cols: Donor Info */}
            <div className="sm:col-span-2 space-y-4">
              <div>
                <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">Donor Full Name</p>
                <h3 className="text-xl font-bold text-white tracking-wide truncate">{donor.name}</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">Donor ID</p>
                  <p className="text-sm font-mono font-bold text-rose-400 tracking-wider bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/50 inline-block">
                    {donor.donor_id}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">Blood Type</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black text-rose-400">{donor.blood_group || 'O+'}</span>
                    <span className="text-[10px] text-stone-400 font-mono">Rh {donor.blood_group?.includes('-') ? 'Neg' : 'Pos'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-stone-300">
                <div className="flex items-center gap-1.5 text-stone-400">
                  <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <span className="truncate">{donor.city || 'Chennai'}, {donor.state || 'TN'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-400">
                  <Calendar className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <span>Since {donor.member_since_year || 2026}</span>
                </div>
              </div>
            </div>

            {/* Right Col: QR Code */}
            <div className="flex flex-col items-center justify-center bg-white p-3 rounded-2xl shadow-inner border border-stone-200">
              <QRCodeCanvas
                value={verifyUrl}
                size={110}
                level="H"
                includeMargin={false}
                data-qr={donor.donor_id}
              />
              <span className="text-[8px] font-mono font-semibold text-stone-600 mt-2 uppercase tracking-widest text-center">
                SCAN FOR DETAILS
              </span>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="mt-6 pt-4 border-t border-stone-800/80 flex items-center justify-between text-[10px] text-stone-400 font-mono relative z-10">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Verified Active Donor
            </span>
            <span className="tracking-widest">SECURE TOKEN AUTH</span>
          </div>
        </div>
      </div>

      {/* Quick Verification & Check-in Tip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-stone-100/80 rounded-2xl p-4 border border-stone-300/80 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-800">Instant Check-In at Donation Camps</h4>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Show this QR code at the reception desk of any affiliated camp or hospital. Staff will scan it to verify your identity and pre-fill your medical donation record automatically.
            </p>
          </div>
        </div>

        <div className="bg-stone-100/80 rounded-2xl p-4 border border-stone-300/80 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-800">Tamper-Proof Digital Verification</h4>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              When anyone scans this QR code, it instantly presents your verified BloodChain medical credentials and donation history.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={handleCopyVerifyUrl}
                className="text-xs font-semibold text-amber-800 hover:text-amber-900 underline flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : null}
                {copiedLink ? 'Link Copied!' : 'Copy Public Verification Link'}
              </button>

              <a
                href={localPreviewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" /> Preview Verification Page
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
