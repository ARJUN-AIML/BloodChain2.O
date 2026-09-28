import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Building2, 
  LogOut, 
  ShieldCheck, 
  RefreshCw, 
  CheckSquare, 
  Truck, 
  Droplet,
  X,
  Radio,
  Search,
  MapPin,
  ChevronRight
} from 'lucide-react';

export const Navbar = () => {
  const { profile, facility, role, logout, loginWithDevToken } = useAuth();
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [allFacilities, setAllFacilities] = useState([]);
  const [facilitySearch, setFacilitySearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');

  useEffect(() => {
    const loadFacilities = async () => {
      try {
        const res = await api.get('/facilities/');
        if (Array.isArray(res.data)) {
          setAllFacilities(res.data);
        }
      } catch (err) {
        console.debug('Failed to load facilities in navbar:', err);
      }
    };
    loadFacilities();
  }, []);

  // Featured regional clusters from the dataset
  const featuredFacilityClusters = [
    {
      clusterName: 'Chennai Metropolitan Transfusion Cluster',
      district: 'Chennai',
      facilities: [
        {
          facilityId: 'ch_h_01',
          name: 'Rajiv Gandhi Government General Hospital',
          type: 'HOSPITAL',
          category: 'Apex State Tertiary Care & Trauma Center',
          tokenPrefix: 'dev-token-ch-h-01'
        },
        {
          facilityId: 'ch_h_05',
          name: 'Apollo Hospitals, Greams Road',
          type: 'HOSPITAL',
          category: 'Super Specialty Partner Hospital',
          tokenPrefix: 'dev-token-ch-h-05'
        },
        {
          facilityId: 'ch_b_01',
          name: 'Indian Voluntary Blood Bank',
          type: 'BLOOD_BANK',
          category: 'Regional Blood Component & Testing Center',
          tokenPrefix: 'dev-token-ch-b-01'
        }
      ]
    },
    {
      clusterName: 'Madurai Regional Healthcare Cluster',
      district: 'Madurai',
      facilities: [
        {
          facilityId: 'ma_h_01',
          name: 'Government Rajaji Hospital',
          type: 'HOSPITAL',
          category: 'Regional Referral & Trauma Center',
          tokenPrefix: 'dev-token-ma-h-01'
        },
        {
          facilityId: 'ma_b_01',
          name: 'Madurai Voluntary Blood Bank & Research Centre',
          type: 'BLOOD_BANK',
          category: 'Regional Central Blood Bank',
          tokenPrefix: 'dev-token-ma-b-01'
        }
      ]
    },
    {
      clusterName: 'Coimbatore Industrial Transfusion Cluster',
      district: 'Coimbatore',
      facilities: [
        {
          facilityId: 'co_h_01',
          name: 'Coimbatore Medical College Hospital',
          type: 'HOSPITAL',
          category: 'Government Medical College Hospital',
          tokenPrefix: 'dev-token-co-h-01'
        },
        {
          facilityId: 'co_b_01',
          name: 'Coimbatore Medical College Hospital Blood Bank',
          type: 'BLOOD_BANK',
          category: 'District Central Blood Repository',
          tokenPrefix: 'dev-token-co-b-01'
        }
      ]
    }
  ];

  const getRoleBadgeLabel = (r) => {
    if (r === 'HOSPITAL') return 'Hospital Administration';
    if (r === 'HOSPITAL_APPROVAL') return 'Clinical Approval Desk';
    if (r === 'HOSPITAL_LOGISTICS') return 'Logistics & Cold-Chain Desk';
    if (r === 'BLOOD_BANK') return 'Regional Blood Bank Operations';
    return r;
  };

  const districts = ['ALL', ...Array.from(new Set(allFacilities.map(f => f.district))).sort()];

  const filteredFacilities = allFacilities.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(facilitySearch.toLowerCase()) ||
                          f.facility_id.toLowerCase().includes(facilitySearch.toLowerCase()) ||
                          f.district.toLowerCase().includes(facilitySearch.toLowerCase());
    const matchesDistrict = selectedDistrict === 'ALL' || f.district === selectedDistrict;
    return matchesSearch && matchesDistrict;
  });

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-700 flex items-center justify-center text-white shadow-sm">
              <Droplet className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white tracking-tight">
                  BloodChain
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700 rounded">
                  Dataset v2.0
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/80 px-2 py-0.5 rounded">
                  <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                  50 State Nodes
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Tamil Nadu Regional Blood Supply System</p>
            </div>
          </div>

          {/* User / Facility Info & Role Switcher */}
          {profile && (
            <div className="flex items-center gap-2.5">
              
              {/* Role Indicator Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800/90 border border-slate-700 text-slate-200">
                {role === 'HOSPITAL_LOGISTICS' ? (
                  <Truck className="w-3.5 h-3.5 text-teal-400" />
                ) : role === 'BLOOD_BANK' ? (
                  <Droplet className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>{getRoleBadgeLabel(role)}</span>
              </div>

              {/* Facility Identity Pill */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/80 text-xs text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-100 max-w-[220px] truncate">{facility?.name}</span>
                <span className="text-[10px] font-mono text-slate-400">({facility?.facility_id})</span>
              </div>

              {/* Persona Switcher Button */}
              <button
                type="button"
                onClick={() => setShowSwitchModal(true)}
                title="Switch Active Facility from Dataset"
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-slate-400" />
                <span className="hidden sm:inline">Switch Facility ({allFacilities.length || 50})</span>
              </button>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={logout}
                title="Sign out of facility session"
                className="px-2.5 py-1 rounded-md bg-slate-800/50 hover:bg-red-950/60 border border-slate-700 hover:border-red-800 text-slate-400 hover:text-red-300 transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}

        </div>
      </header>

      {/* Switch Facility Persona Modal (All 50 Facilities from Dataset) */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="clinical-card-elevated max-w-4xl w-full p-6 bg-slate-900 border-slate-700 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-slate-400" />
                  <span>Switch Operational Facility from Dataset</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select any of the 50 accredited hospitals and blood banks across Tamil Nadu
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-8 relative">
                <input
                  type="text"
                  placeholder="Search 50 facilities by name, district, or ID (e.g. Stanley, Madurai, ch_h_01)..."
                  value={facilitySearch}
                  onChange={(e) => setFacilitySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-slate-600 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:ring-2 focus:ring-slate-600 focus:outline-none"
                >
                  {districts.map(d => (
                    <option key={d} value={d}>
                      {d === 'ALL' ? 'All Districts (Tamil Nadu)' : `District: ${d}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scrollable Facilities List */}
            <div className="max-h-[55vh] overflow-y-auto space-y-4 pr-1">
              
              {/* If no search term, show Featured Clusters first */}
              {!facilitySearch && selectedDistrict === 'ALL' && (
                <div className="space-y-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    <span>Primary Regional Clusters</span>
                  </div>

                  {featuredFacilityClusters.map((cluster, cIdx) => (
                    <div key={cIdx} className="space-y-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-200">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          <span>{cluster.clusterName}</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                          {cluster.district}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {cluster.facilities.map((fac, fIdx) => (
                          <div key={fIdx} className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/90 hover:border-slate-700 space-y-2 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-slate-400 font-semibold">{fac.facilityId}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                                  fac.type === 'BLOOD_BANK' 
                                    ? 'bg-red-950/60 text-red-300 border border-red-800' 
                                    : 'bg-indigo-950/60 text-indigo-300 border border-indigo-800'
                                }`}>
                                  {fac.type === 'BLOOD_BANK' ? 'Blood Bank' : 'Hospital'}
                                </span>
                              </div>
                              <div className="text-xs font-semibold text-slate-100 mt-1 line-clamp-1">{fac.name}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{fac.category}</div>
                            </div>

                            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                              {fac.type === 'HOSPITAL' ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await loginWithDevToken(`dev-token-${fac.facilityId}`);
                                      setShowSwitchModal(false);
                                    }}
                                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium border border-slate-700 cursor-pointer"
                                  >
                                    Admin
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await loginWithDevToken(`dev-token-${fac.facilityId}-appr`);
                                      setShowSwitchModal(false);
                                    }}
                                    className="px-2 py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 text-[10px] font-medium border border-indigo-800 cursor-pointer"
                                  >
                                    Approval
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await loginWithDevToken(`dev-token-${fac.facilityId}-log`);
                                      setShowSwitchModal(false);
                                    }}
                                    className="px-2 py-0.5 rounded bg-teal-950/80 hover:bg-teal-900 text-teal-300 text-[10px] font-medium border border-teal-800 cursor-pointer"
                                  >
                                    Logistics
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await loginWithDevToken(`dev-token-${fac.facilityId}`);
                                    setShowSwitchModal(false);
                                  }}
                                  className="w-full py-1 rounded bg-red-950/80 hover:bg-red-900 text-red-300 text-[10px] font-semibold border border-red-800 cursor-pointer text-center"
                                >
                                  Central Repository
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* All 50 Facilities Browser */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between px-1">
                  <span>Accredited State Dataset Facilities ({filteredFacilities.length})</span>
                  <span className="text-[10px] font-mono text-slate-500">Dataset: area-based IDs</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredFacilities.map((fac) => {
                    const isCurrent = facility?.facility_id === fac.facility_id;
                    return (
                      <div
                        key={fac.facility_id}
                        className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-colors ${
                          isCurrent
                            ? 'bg-slate-800 border-slate-600 ring-1 ring-slate-500'
                            : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-semibold text-slate-300">{fac.facility_id}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                              District: {fac.district}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-100 mt-1 truncate">{fac.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {fac.facility_type === 'BLOOD_BANK' ? 'Regional Blood Bank' : 'Accredited Hospital'}
                          </div>
                        </div>

                        <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">Switch workspace:</span>
                          <div className="flex gap-1.5">
                            {fac.facility_type === 'HOSPITAL' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await loginWithDevToken(`dev-token-${fac.facility_id}`);
                                    setShowSwitchModal(false);
                                  }}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium border border-slate-700 cursor-pointer"
                                >
                                  Admin
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await loginWithDevToken(`dev-token-${fac.facility_id}-appr`);
                                    setShowSwitchModal(false);
                                  }}
                                  className="px-2 py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 text-[10px] font-medium border border-indigo-800 cursor-pointer"
                                >
                                  Approval
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await loginWithDevToken(`dev-token-${fac.facility_id}-log`);
                                    setShowSwitchModal(false);
                                  }}
                                  className="px-2 py-0.5 rounded bg-teal-950/80 hover:bg-teal-900 text-teal-300 text-[10px] font-medium border border-teal-800 cursor-pointer"
                                >
                                  Logistics
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={async () => {
                                  await loginWithDevToken(`dev-token-${fac.facility_id}`);
                                  setShowSwitchModal(false);
                                }}
                                className="px-2.5 py-0.5 rounded bg-red-950/80 hover:bg-red-900 text-red-300 text-[10px] font-semibold border border-red-800 cursor-pointer"
                              >
                                Central Repository
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span>Showing accredited facilities from Tamil Nadu State Dataset</span>
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
