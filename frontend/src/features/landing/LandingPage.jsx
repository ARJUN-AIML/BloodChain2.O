import React, { useState, useEffect } from 'react';
import heroImg from '../../assets/hero-blood-touch.png';
import portalPreviewImg from '../../assets/portal-preview.png';
import api from '../../services/api';
import {
  Droplet,
  ShieldCheck,
  Thermometer,
  Database,
  ArrowRight,
  Radio,
  Building2,
  Activity,
  CheckCircle2,
  Lock,
  Truck,
  HeartHandshake,
  Compass,
  Cpu,
  Layers,
  Sparkles,
  Users,
  Search,
  ExternalLink,
  ChevronDown,
  Clock,
  MapPin,
  Check,
  AlertTriangle
} from 'lucide-react';

export const LandingPage = ({ onNavigateToLogin, onSelectFacilityForLogin }) => {
  const [facilities, setFacilities] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Load facilities from backend or dataset
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const res = await api.get('/facilities/');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setFacilities(res.data);
        }
      } catch (err) {
        console.debug('Failed to fetch facilities for landing directory:', err);
      }
    };
    fetchFacilities();
  }, []);

  // Filter facilities
  const districts = ['ALL', ...Array.from(new Set(facilities.map(f => f.district))).sort()];

  const filteredFacilities = facilities.filter(f => {
    const matchesDistrict = selectedDistrict === 'ALL' || f.district === selectedDistrict;
    const matchesSearch = !searchQuery || 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.facility_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDistrict && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-rose-500/30 selection:text-rose-200">
      
      {/* AMBIENT GLOW ACCENTS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-rose-950/20 via-rose-900/10 to-transparent blur-3xl opacity-60"></div>
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-red-950/15 blur-3xl rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-rose-950/10 blur-3xl rounded-full"></div>
      </div>

      {/* HERO SECTION WITH THE SACRED TOUCH ARTWORK IN THE BACKGROUND (NOT STRETCHED AS WALLPAPER) */}
      <section className="relative z-10 min-h-[88vh] flex flex-col justify-between pt-8 pb-12 lg:pt-14 lg:pb-16 border-b border-slate-900 overflow-hidden">
        
        {/* BACKGROUND ARTWORK LAYER - POSITIONED AS BACKGROUND ART WITHOUT BEING A STRETCHED DARK WALLPAPER */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 lg:right-[1%] xl:right-[5%] z-0 pointer-events-none select-none max-w-2xl w-full flex items-center justify-center opacity-90 lg:opacity-100">
          {/* Subtle warm ambient backlight glow */}
          <div className="absolute -inset-10 bg-gradient-to-r from-rose-900/25 via-red-900/15 to-transparent blur-3xl rounded-full"></div>
          
          {/* Artwork container with soft feathered edges that dissolve into the dark slate canvas */}
          <div className="relative rounded-3xl overflow-hidden [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_96%)] max-h-[520px]">
            <img
              src={heroImg}
              alt="BloodChain The Sacred Touch"
              className="w-full h-auto object-contain max-h-[500px] drop-shadow-[0_25px_60px_rgba(185,28,28,0.35)]"
            />
            {/* Subtle soft gradient fade on the left edge so text flows over it naturally */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/20 to-transparent lg:w-1/3"></div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full my-auto">
          
          {/* Top Network Status Pill */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs text-slate-200 shadow-2xl backdrop-blur-xl">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="font-semibold text-rose-400 tracking-wide uppercase text-[11px]">BloodChain Network v2.0</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300">50 Accredited State Nodes Live</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Zero-Trust Verified
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* LEFT COLUMN: HERO TEXT & PROSE */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-6 text-center lg:text-left">
              
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
                  Every Drop a <span className="bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 bg-clip-text text-transparent">Lifeline.</span><br />
                  Every Transfer <span className="bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">Verifiable.</span>
                </h1>
                
                <p className="text-base sm:text-lg text-slate-200/90 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0 drop-shadow-sm">
                  Bridging the gap between compassionate voluntary donors and emergency clinical recipients. BloodChain coordinates real-time blood requisition, cold-chain compliance, and cryptographic custody verification across 50 apex state medical centers.
                </p>
              </div>

              {/* Literary Quotation / Prose Callout with Glassmorphism */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/75 backdrop-blur-xl border-l-4 border-rose-600 border-y border-r border-slate-800/90 text-left shadow-2xl max-w-2xl">
                <p className="text-xs sm:text-sm text-slate-200 italic font-serif leading-relaxed">
                  "In the space between two reaching hands lies humanity's greatest act of solidarity: the gift of blood. One hand gives freely of life; the other clings to hope. BloodChain safeguards that sacred droplet—guaranteeing it arrives pure, cold, and without delay."
                </p>
                <div className="mt-3 text-[11px] font-mono text-rose-400 flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>The Sacred Journey • Vein to Vein Custody Handshake</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-sm shadow-xl shadow-rose-900/40 hover:shadow-rose-900/60 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>Enter Facility Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <a
                  href="#network"
                  className="w-full sm:w-auto px-5 py-3.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 hover:text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm backdrop-blur-md"
                >
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>Explore 50 State Nodes</span>
                </a>
              </div>

              {/* Quick Metrics Bar */}
              <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-800/80 text-left max-w-xl">
                <div>
                  <div className="text-lg sm:text-2xl font-bold font-mono text-white">50 Nodes</div>
                  <div className="text-[11px] text-slate-400">Apex Hospitals & Banks</div>
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-bold font-mono text-emerald-400">2°C – 6°C</div>
                  <div className="text-[11px] text-slate-400">Active Cold-Chain</div>
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-bold font-mono text-rose-400">100%</div>
                  <div className="text-[11px] text-slate-400">Custody Auditability</div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: UNOBSTRUCTED SO BACKGROUND ARTWORK IS FULLY VISIBLE */}
            <div className="lg:col-span-5 xl:col-span-5 hidden lg:flex flex-col justify-end items-end h-full pt-16">
              
              {/* Minimal floating telemetry chip that lets the artwork breathe */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/90 text-xs text-slate-300 shadow-2xl space-y-2 max-w-xs text-left">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>State Transfusion Grid</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    TN-2026
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-teal-400" />
                    <span>Cold-Chain Telemetry:</span>
                  </span>
                  <span className="font-mono text-teal-400 font-bold">3.8°C</span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Vein-to-Vein Settlement</span>
                  <span className="text-emerald-400 font-semibold">Verified</span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* BOTTOM SMOOTH SCROLL INDICATOR */}
        <div className="relative z-10 flex justify-center pt-6">
          <a
            href="#pillars"
            className="inline-flex flex-col items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer group"
          >
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400 group-hover:text-rose-400 transition-colors">
              Explore Network Architecture & Features
            </span>
            <ChevronDown className="w-4 h-4 text-rose-500 animate-bounce" />
          </a>
        </div>

      </section>

      {/* THREE PILLARS OF INTEGRITY SECTION */}
      <section id="pillars" className="py-16 sm:py-20 bg-slate-950 border-b border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-rose-400 bg-rose-950/40 border border-rose-800/60 px-3 py-1 rounded-full">
              Engineered for Clinical Zero-Failure
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Three Pillars of Cryptographic Life Logistics
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Traditional blood delivery relies on fragile paper chits and unmonitored iceboxes. BloodChain replaces uncertainty with verifiable digital custody.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pillar 1 */}
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-rose-900/60 transition-all hover:shadow-xl hover:shadow-rose-950/20 group">
              <div className="w-12 h-12 rounded-lg bg-rose-950/60 border border-rose-800/70 flex items-center justify-center text-rose-400 mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Zero-Trust Physical Custody</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                Dual-authorization cryptographic handshakes. Hospital receiving docks verify each delivery with a 6-digit manifest PIN, instantly settling transfer ownership on the ledger.
              </p>
              <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 pt-3 border-t border-slate-800">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Prevents diversion & missing units</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-teal-900/60 transition-all hover:shadow-xl hover:shadow-teal-950/20 group">
              <div className="w-12 h-12 rounded-lg bg-teal-950/60 border border-teal-800/70 flex items-center justify-center text-teal-400 mb-5 group-hover:scale-110 transition-transform">
                <Thermometer className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Active Cold-Chain Telemetry</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                Continuous thermal compliance sensors tracking temperatures strictly between 2°C – 6°C across transit corridors. Automatic threshold alerts ensure zero spoilage.
              </p>
              <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 pt-3 border-t border-slate-800">
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span>Zero thermal hemolysis compromise</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-indigo-900/60 transition-all hover:shadow-xl hover:shadow-indigo-950/20 group">
              <div className="w-12 h-12 rounded-lg bg-indigo-950/60 border border-indigo-800/70 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Autonomous Deficit Forecasting</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                State-wide predictive balancing between surplus blood banks and high-trauma surgical hospitals, preempting shortages for rare groups (O-, AB-, Bombay phenotype).
              </p>
              <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 pt-3 border-t border-slate-800">
                <Check className="w-3.5 h-3.5 text-indigo-400" />
                <span>Predictive inter-district rebalancing</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* THE 5-STAGE PIPELINE: THE SACRED JOURNEY OF A DROP */}
      <section className="py-16 sm:py-20 bg-slate-900/40 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400 bg-amber-950/40 border border-amber-800/60 px-3 py-1 rounded-full">
              End-to-End Traceability
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              The Journey of a Life-Saving Unit
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              From the selfless donor's vein to the operating theater — every step immutably tracked on BloodChain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-2">
              <div className="text-xs font-mono font-bold text-rose-400 flex items-center justify-between">
                <span>PHASE 01</span>
                <Droplet className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-semibold text-white">Voluntary Donation</div>
              <p className="text-[12px] text-slate-400 leading-relaxed">
                Collection & clinical screening at accredited blood banks; component separation into PRBC, FFP, Platelets, and Cryo.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-2">
              <div className="text-xs font-mono font-bold text-indigo-400 flex items-center justify-between">
                <span>PHASE 02</span>
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-semibold text-white">Ledger Ingestion</div>
              <p className="text-[12px] text-slate-400 leading-relaxed">
                Unit receives a cryptographic batch identifier and barcode timestamped into the state inventory registry.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-2">
              <div className="text-xs font-mono font-bold text-amber-400 flex items-center justify-between">
                <span>PHASE 03</span>
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-semibold text-white">Urgent Requisition</div>
              <p className="text-[12px] text-slate-400 leading-relaxed">
                Hospital emergency wing triggers immediate or predictive demand; nearest matched repository dispatches units.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-2">
              <div className="text-xs font-mono font-bold text-teal-400 flex items-center justify-between">
                <span>PHASE 04</span>
                <Truck className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-semibold text-white">Cold-Chain Transit</div>
              <p className="text-[12px] text-slate-400 leading-relaxed">
                Active thermal telemetry broadcasts temperature in real time; courier manifest is locked during road transit.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-2">
              <div className="text-xs font-mono font-bold text-emerald-400 flex items-center justify-between">
                <span>PHASE 05</span>
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-semibold text-white">Dockside Handshake</div>
              <p className="text-[12px] text-slate-400 leading-relaxed">
                Receiving physician inspects cold seal and submits the 6-digit manifest OTP to confirm atomic custody and transfusion.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* INTERACTIVE STATE NODE DIRECTORY (50 ACCREDITED CENTERS) */}
      <section id="network" className="py-16 sm:py-20 bg-slate-950 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/80 px-2.5 py-1 rounded">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>Tamil Nadu State Transfusion Grid</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Accredited State Network Nodes ({facilities.length || 50})
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Browse government medical colleges, apex trauma hospitals, and regional central blood banks linked to BloodChain.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hospital or district..."
                  className="w-full sm:w-64 pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-600 transition-colors"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>

              <button
                type="button"
                onClick={onNavigateToLogin}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Sign In as Node</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* District Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin">
            {districts.map(dist => (
              <button
                key={dist}
                type="button"
                onClick={() => setSelectedDistrict(dist)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedDistrict === dist
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {dist === 'ALL' ? 'All Districts' : dist}
              </button>
            ))}
          </div>

          {/* Facilities Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[560px] overflow-y-auto pr-1">
            {filteredFacilities.map((fac) => {
              const isBloodBank = fac.facility_type === 'BLOOD_BANK';
              return (
                <div
                  key={fac.facility_id}
                  className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                        isBloodBank 
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                          : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
                      }`}>
                        {isBloodBank ? 'BLOOD BANK' : 'HOSPITAL'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {fac.facility_id}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-white group-hover:text-rose-400 transition-colors line-clamp-1">
                      {fac.name}
                    </h4>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{fac.district}, Tamil Nadu</span>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>Verified Node</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectFacilityForLogin(fac)}
                      className="text-[11px] text-slate-300 hover:text-white font-medium flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>Access Node</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* PORTAL ACCESS CALL TO ACTION BANNER */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-slate-900/60 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="relative rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-slate-800 p-8 sm:p-12 overflow-hidden shadow-2xl">
            
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-rose-600/10 to-transparent pointer-events-none"></div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-8 space-y-4">
                <span className="text-xs font-mono font-semibold text-rose-400 uppercase tracking-wider">
                  Accredited Clinical Gateway
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Ready to Coordinate Life-Saving Transfusions?
                </h2>
                <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Medical superintendents, transfusion medicine officers, and clinical logistics personnel can log in directly with accredited credentials to manage real-time inventory, dispatch units, and verify custody handshakes.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-sm shadow-xl shadow-rose-950/40 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Launch Facility Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Protected by Firebase Auth & Google Identity</span>
                  </div>
                </div>
              </div>

              {/* Preview image of the login portal */}
              <div className="lg:col-span-4 hidden lg:block">
                <div className="rounded-xl overflow-hidden border border-slate-700 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-300">
                  <img
                    src={portalPreviewImg}
                    alt="Facility Access Gateway"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 bg-slate-950 border-t border-slate-900 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded bg-rose-600 flex items-center justify-center text-white">
              <Droplet className="w-3 h-3 fill-white" />
            </div>
            <span className="font-bold text-slate-300 tracking-tight">BloodChain</span>
            <span className="text-slate-600">|</span>
            <span>Tamil Nadu State Blood Transfusion Network</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <span>Dataset v2.0</span>
            <span>Cold-Chain 2°C–6°C</span>
            <span>WCAG AAA</span>
            <span>Firebase Security Rule Certified</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
