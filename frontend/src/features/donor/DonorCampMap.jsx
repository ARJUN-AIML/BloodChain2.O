import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import { DonorCampModal } from './DonorCampModal';
import { 
  MapPin, 
  Search, 
  Filter, 
  Building2, 
  Calendar, 
  Clock, 
  Droplet, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  List, 
  Map as MapIcon, 
  Phone, 
  Mail, 
  Users,
  ChevronRight,
  Sparkles,
  Info,
  ShieldCheck,
  Check,
  ExternalLink,
  Hospital,
  Tent,
  ArrowRight,
  ZoomIn,
  RotateCcw
} from 'lucide-react';

// Fix Leaflet default icon issues in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export const DISTRICT_COORDINATES = {
  Ariyalur: [11.1399, 79.0768],
  Chengalpattu: [12.6841, 79.9836],
  Chennai: [13.0827, 80.2707],
  Coimbatore: [11.0168, 76.9558],
  Dharmapuri: [12.1357, 78.1584],
  Dindigul: [10.3673, 77.9803],
  Erode: [11.3410, 77.7172],
  Kanyakumari: [8.0883, 77.5385],
  Karur: [10.9601, 78.0766],
  Krishnagiri: [12.5186, 78.2137],
  Madurai: [9.9252, 78.1198],
  Namakkal: [11.2189, 78.1674],
  Pudukkottai: [10.3797, 78.8208],
  Ramanathapuram: [9.3639, 78.8395],
  Salem: [11.6643, 78.1460],
  Sivaganga: [9.8433, 78.4809],
  Thanjavur: [10.7870, 79.1378],
  Theni: [10.0104, 77.4768],
  Thoothukudi: [8.7642, 78.1348],
  Tiruchirappalli: [10.7905, 78.7047],
  Tirunelveli: [8.7139, 77.7567],
  Tiruvannamalai: [12.2253, 79.0747],
  Tiruvarur: [10.7725, 79.6365],
  Vellore: [12.9165, 79.1325],
};

export const FACILITY_COORDINATES = {
  // Chennai
  ch_h_01: [13.0805, 80.2778],
  ch_h_02: [13.1075, 80.2872],
  ch_h_03: [13.0784, 80.2435],
  ch_h_04: [13.0694, 80.2725],
  ch_h_05: [13.0604, 80.2496],
  ch_h_06: [13.0234, 80.1856],
  ch_b_01: [13.0732, 80.2609],
  ch_b_02: [13.0878, 80.2785],
  ch_b_03: [13.0520, 80.2520],
  ch_b_04: [12.9863, 80.2431],
  ch_b_05: [13.0712, 80.2411],
  ch_b_06: [13.0635, 80.2642],
  // Coimbatore
  co_h_01: [11.0016, 76.9696],
  co_h_02: [11.0210, 76.9890],
  co_b_01: [11.0025, 76.9710],
  // Madurai
  ma_h_01: [9.9252, 78.1255],
  ma_b_01: [9.9230, 78.1180],
  ma_b_02: [9.9265, 78.1270],
  // Salem
  sa_h_01: [11.6540, 78.1560],
  sa_b_01: [11.6620, 78.1480],
  sa_b_02: [11.6580, 78.1510],
  sa_b_03: [11.6660, 78.1420],
  sa_b_04: [11.6555, 78.1575],
  // Tiruchirappalli
  tr_h_01: [10.8050, 78.6920],
  tr_h_02: [10.8120, 78.6850],
  tr_b_01: [10.8140, 78.6870],
  // Tirunelveli
  ti_h_01: [8.7180, 77.7490],
  ti_b_01: [8.7195, 77.7510],
  // Thanjavur
  th_h_01: [10.7720, 79.1250],
  th_b_01: [10.7850, 79.1350],
  th_b_02: [10.7735, 79.1265],
  // Vellore
  ve_h_01: [12.9249, 79.1350],
  ve_b_01: [12.9260, 79.1365],
  // Dindigul
  di_h_01: [10.3673, 77.9803],
  di_b_01: [10.3690, 77.9820],
  // Single Facility Districts
  ar_h_01: [11.1399, 79.0768],
  ce_h_01: [12.6841, 79.9836],
  dh_h_01: [12.1357, 78.1584],
  er_b_01: [11.3410, 77.7172],
  ky_h_01: [8.0883, 77.5385],
  ka_h_01: [10.9601, 78.0766],
  kg_h_01: [12.5186, 78.2137],
  na_h_01: [11.2189, 78.1674],
  pu_h_01: [10.3797, 78.8208],
  ra_h_01: [9.3639, 78.8395],
  si_h_01: [9.8433, 78.4809],
  tn_h_01: [10.0104, 77.4768],
  to_h_01: [8.7642, 78.1348],
  tv_h_01: [12.2253, 79.0747],
  tu_h_01: [10.7725, 79.6365],
};

const DEFAULT_MAP_CENTER = [11.1271, 78.6569]; // Center of Tamil Nadu
const DEFAULT_MAP_ZOOM = 7;

// Map Controller: smooth flyTo and zoom synchronization
function MapController({ center, zoom, onZoomChange }) {
  const map = useMap();

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom || 11, { duration: 1.1 });
    }
  }, [center, zoom, map]);

  useEffect(() => {
    const handleZoom = () => {
      if (onZoomChange) {
        onZoomChange(map.getZoom());
      }
    };
    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map, onZoomChange]);

  return null;
}

// 1. Custom District Hub Marker (Displayed in State Overview to prevent clustering clutter)
const createDistrictClusterMarker = (cluster) => {
  const { districtName, facilityCount, criticalCampsCount, campsCount } = cluster;

  let alertBadge = '';
  if (criticalCampsCount > 0) {
    alertBadge = `
      <span class="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-extrabold animate-pulse border border-white flex items-center gap-0.5 shadow-sm">
        🚨 ${criticalCampsCount} Critical
      </span>
    `;
  } else if (campsCount > 0) {
    alertBadge = `
      <span class="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-bold border border-white shadow-sm">
        ⛺ ${campsCount} Drives
      </span>
    `;
  }

  return L.divIcon({
    className: 'custom-district-hub-pin',
    html: `
      <div class="relative flex items-center justify-center cursor-pointer group">
        <div class="px-3 py-1.5 rounded-2xl bg-white/95 text-stone-900 shadow-xl border-2 border-rose-500/80 backdrop-blur-md flex items-center gap-2 transform hover:scale-110 hover:shadow-2xl transition duration-200">
          <div class="w-6 h-6 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
            🏥
          </div>
          <div class="flex flex-col text-left leading-tight pr-1">
            <span class="text-xs font-extrabold text-stone-900 tracking-tight whitespace-nowrap">${districtName}</span>
            <span class="text-[10px] text-stone-500 font-mono font-medium">${facilityCount} Nodes</span>
          </div>
          ${alertBadge}
        </div>
      </div>
    `,
    iconSize: [140, 40],
    iconAnchor: [70, 20],
    popupAnchor: [0, -22],
  });
};

// 2. Custom Camp Marker (Distinguished by Urgency with Tent Emblem)
const createCampMarker = (camp, isUserRegistered = false) => {
  const isCritical = camp.urgency === 'CRITICAL';
  const isActive = camp.status === 'ACTIVE';
  const isCompleted = camp.status === 'COMPLETED';

  let bgClass = 'bg-rose-600 text-white';
  let pulseHtml = '';

  if (isCritical) {
    bgClass = 'bg-red-600 text-white shadow-lg shadow-red-600/50';
    pulseHtml = '<span class="absolute -inset-2 rounded-2xl bg-red-500 animate-ping opacity-75"></span>';
  } else if (isActive) {
    bgClass = 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/50';
    pulseHtml = '<span class="absolute -inset-1.5 rounded-2xl bg-emerald-500 animate-pulse opacity-60"></span>';
  } else if (isCompleted) {
    bgClass = 'bg-stone-500 text-stone-100';
  }

  const registeredBadge = isUserRegistered
    ? '<span class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white shadow">✓</span>'
    : '';

  const labelBadge = isCritical
    ? '<span class="absolute -bottom-5 whitespace-nowrap px-2 py-0.5 bg-red-600 text-white text-[9px] font-extrabold rounded-full shadow border border-white uppercase tracking-wider">🚨 Critical Need</span>'
    : '';

  return L.divIcon({
    className: 'custom-camp-pin',
    html: `
      <div class="relative flex flex-col items-center justify-center cursor-pointer group">
        ${pulseHtml}
        <div class="w-10 h-10 rounded-2xl ${bgClass} shadow-xl flex items-center justify-center text-sm font-bold border-2 border-white transform hover:scale-115 transition duration-200">
          <span style="font-size: 17px;">⛺</span>
        </div>
        ${registeredBadge}
        ${labelBadge}
      </div>
    `,
    iconSize: [40, 48],
    iconAnchor: [20, 24],
    popupAnchor: [0, -26],
  });
};

// 3. Custom Hospital Marker (Distinguished by Blue Shield with Hospital Emblem)
const createHospitalMarker = (facility, activeCampsCount = 0) => {
  const campCountBadge = activeCampsCount > 0
    ? `<span class="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-extrabold flex items-center justify-center border-2 border-white shadow animate-pulse">${activeCampsCount}</span>`
    : '';

  return L.divIcon({
    className: 'custom-hospital-pin',
    html: `
      <div class="relative flex items-center justify-center cursor-pointer">
        <div class="w-9 h-9 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-900/30 flex items-center justify-center text-sm font-bold border-2 border-white transform hover:scale-115 transition duration-200">
          <span style="font-size: 15px;">🏥</span>
        </div>
        ${campCountBadge}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

// 4. Custom Blood Bank Marker (Distinguished by Purple/Indigo with Blood Bank Emblem)
const createBloodBankMarker = (facility, activeCampsCount = 0) => {
  const campCountBadge = activeCampsCount > 0
    ? `<span class="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-extrabold flex items-center justify-center border-2 border-white shadow animate-pulse">${activeCampsCount}</span>`
    : '';

  return L.divIcon({
    className: 'custom-blood-bank-pin',
    html: `
      <div class="relative flex items-center justify-center cursor-pointer">
        <div class="w-9 h-9 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-900/30 flex items-center justify-center text-sm font-bold border-2 border-white transform hover:scale-115 transition duration-200">
          <span style="font-size: 15px;">🏢</span>
        </div>
        ${campCountBadge}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

export const DonorCampMap = ({ donor }) => {
  const [camps, setCamps] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedEntityType, setSelectedEntityType] = useState('ALL'); // 'ALL' | 'CAMP' | 'HOSPITAL' | 'BLOOD_BANK' | 'FACILITIES'
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'ACTIVE' | 'UPCOMING'
  
  // Dynamic Map Navigation Center & Zoom Tracking
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_MAP_ZOOM);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_MAP_ZOOM);

  // Zoom Threshold: Is the user zoomed in to a district level?
  const isDistrictZoomed = currentZoom >= 9 || selectedDistrict !== 'ALL';

  // Registration Modal
  const [activeCampForModal, setActiveCampForModal] = useState(null);

  // Fetch Unified Data: Camps + Facilities + User Registrations
  const fetchMapData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [campsRes, facilitiesRes, regsRes] = await Promise.all([
        api.get('/camps/').catch((err) => {
          console.warn('Error fetching camps:', err);
          return { data: [] };
        }),
        api.get('/facilities/').catch((err) => {
          console.warn('Error fetching facilities:', err);
          return { data: [] };
        }),
        api.get('/donors/me/registrations/').catch(() => ({ data: [] }))
      ]);

      const campList = Array.isArray(campsRes.data)
        ? campsRes.data
        : campsRes.data?.results || [];
      const facilityList = Array.isArray(facilitiesRes.data)
        ? facilitiesRes.data
        : facilitiesRes.data?.results || [];
      const regList = Array.isArray(regsRes.data)
        ? regsRes.data
        : regsRes.data?.results || [];

      setCamps(campList);
      setFacilities(facilityList);
      setMyRegistrations(regList);
    } catch (err) {
      console.error('Error fetching map data:', err);
      setError('Unable to load map data. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  // Compute list of unique districts across facilities and camps
  const districts = useMemo(() => {
    return ['ALL', ...Array.from(new Set([
      ...facilities.map((f) => f.district).filter(Boolean),
      ...camps.map((c) => c.organizer_district).filter(Boolean)
    ])).sort()];
  }, [facilities, camps]);

  // Handle District Change & Smooth Map FlyTo
  const handleDistrictChange = (districtName) => {
    setSelectedDistrict(districtName);
    if (districtName === 'ALL') {
      setMapCenter(DEFAULT_MAP_CENTER);
      setMapZoom(DEFAULT_MAP_ZOOM);
      setCurrentZoom(DEFAULT_MAP_ZOOM);
    } else if (DISTRICT_COORDINATES[districtName]) {
      setMapCenter(DISTRICT_COORDINATES[districtName]);
      setMapZoom(11);
      setCurrentZoom(11);
    }
  };

  // Handle interactive zoom level changes from map
  const handleZoomChange = (newZoom) => {
    setCurrentZoom(newZoom);
    if (newZoom < 9 && selectedDistrict !== 'ALL') {
      setSelectedDistrict('ALL');
    }
  };

  // Helper: check if donor is registered for a given camp
  const isDonorRegisteredForCamp = (campId) => {
    return myRegistrations.some(
      (r) => r.camp_id === campId && r.status !== 'CANCELLED'
    );
  };

  // Filter Camps based on search, district, entity, blood group, and urgency
  const filteredCamps = useMemo(() => {
    return camps.filter((camp) => {
      // Entity filter
      if (['HOSPITAL', 'BLOOD_BANK', 'FACILITIES'].includes(selectedEntityType)) {
        return false;
      }

      // District filter
      const campDistrict = camp.organizer_district || '';
      const matchesDistrict =
        selectedDistrict === 'ALL' ||
        campDistrict.toLowerCase() === selectedDistrict.toLowerCase() ||
        camp.venue_address?.toLowerCase().includes(selectedDistrict.toLowerCase()) ||
        camp.venue_name?.toLowerCase().includes(selectedDistrict.toLowerCase());

      // Search query match
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        camp.camp_name?.toLowerCase().includes(searchLower) ||
        camp.venue_name?.toLowerCase().includes(searchLower) ||
        camp.venue_address?.toLowerCase().includes(searchLower) ||
        camp.organizer_name?.toLowerCase().includes(searchLower) ||
        campDistrict.toLowerCase().includes(searchLower);

      // Blood group filter
      const matchesBlood =
        selectedBloodGroup === 'ALL' ||
        (Array.isArray(camp.required_blood_groups) &&
          (camp.required_blood_groups.includes(selectedBloodGroup) ||
            camp.required_blood_groups.length === 0));

      // Urgency / Status filter
      let matchesUrgency = true;
      if (selectedUrgency === 'CRITICAL') matchesUrgency = camp.urgency === 'CRITICAL';
      else if (selectedUrgency === 'ACTIVE') matchesUrgency = camp.status === 'ACTIVE';
      else if (selectedUrgency === 'UPCOMING') matchesUrgency = camp.status === 'UPCOMING';

      return matchesDistrict && matchesSearch && matchesBlood && matchesUrgency;
    });
  }, [camps, selectedEntityType, selectedDistrict, searchTerm, selectedBloodGroup, selectedUrgency]);

  // Filter Facilities (Hospitals and Blood Banks)
  const filteredFacilities = useMemo(() => {
    return facilities.filter((fac) => {
      // Entity filter
      if (selectedEntityType === 'CAMP') return false;
      if (selectedEntityType === 'HOSPITAL' && fac.facility_type !== 'HOSPITAL') return false;
      if (selectedEntityType === 'BLOOD_BANK' && fac.facility_type !== 'BLOOD_BANK') return false;

      // District filter
      const matchesDistrict =
        selectedDistrict === 'ALL' ||
        fac.district?.toLowerCase() === selectedDistrict.toLowerCase();

      // Search query match
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        fac.name?.toLowerCase().includes(searchLower) ||
        fac.district?.toLowerCase().includes(searchLower) ||
        fac.address?.toLowerCase().includes(searchLower) ||
        fac.facility_id?.toLowerCase().includes(searchLower);

      return matchesDistrict && matchesSearch;
    });
  }, [facilities, selectedEntityType, selectedDistrict, searchTerm]);

  // UNCLUTTERED MAP RENDERING LOGIC:
  // 1. If NOT zoomed in (State Overview):
  //    - ONLY show Critical Need Blood Camps on the map!
  //    - Show District Hub clusters (not 50 overlapping pins).
  // 2. If ZOOMED in (District Detail):
  //    - Show all local hospitals, blood banks, and all available scheduled camps!
  const mapCampsToRender = useMemo(() => {
    if (isDistrictZoomed) {
      return filteredCamps;
    }
    // Zoomed out state view: ONLY show Critical Need camps!
    return filteredCamps.filter((c) => c.urgency === 'CRITICAL');
  }, [isDistrictZoomed, filteredCamps]);

  // Compute District Clusters for State Overview Mode
  const districtClusters = useMemo(() => {
    return districts
      .filter((d) => d !== 'ALL')
      .map((districtName) => {
        const districtFacilities = facilities.filter(
          (f) => f.district?.toLowerCase() === districtName.toLowerCase()
        );
        const districtCamps = camps.filter(
          (c) =>
            (c.organizer_district && c.organizer_district.toLowerCase() === districtName.toLowerCase()) ||
            c.venue_address?.toLowerCase().includes(districtName.toLowerCase()) ||
            c.venue_name?.toLowerCase().includes(districtName.toLowerCase())
        );
        const criticalCamps = districtCamps.filter((c) => c.urgency === 'CRITICAL');
        const coords = DISTRICT_COORDINATES[districtName] || DEFAULT_MAP_CENTER;

        return {
          districtName,
          facilityCount: districtFacilities.length,
          hospitalCount: districtFacilities.filter((f) => f.facility_type === 'HOSPITAL').length,
          bloodBankCount: districtFacilities.filter((f) => f.facility_type === 'BLOOD_BANK').length,
          campsCount: districtCamps.length,
          criticalCampsCount: criticalCamps.length,
          coords,
        };
      })
      .filter((cluster) => cluster.facilityCount > 0 || cluster.campsCount > 0);
  }, [districts, facilities, camps]);

  const hospitalsCount = filteredFacilities.filter((f) => f.facility_type === 'HOSPITAL').length;
  const bloodBanksCount = filteredFacilities.filter((f) => f.facility_type === 'BLOOD_BANK').length;
  const campsCount = filteredCamps.length;
  const criticalCampsCount = camps.filter((c) => c.urgency === 'CRITICAL').length;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get active camps organized by a specific facility
  const getCampsForFacility = (facilityId) => {
    return camps.filter(
      (c) => c.organizer_id === facilityId && c.status !== 'CANCELLED'
    );
  };

  // Fly to facility location and switch to map view
  const focusFacilityOnMap = (fac) => {
    const lat = fac.latitude || (FACILITY_COORDINATES[fac.facility_id] || DISTRICT_COORDINATES[fac.district] || DEFAULT_MAP_CENTER)[0];
    const lng = fac.longitude || (FACILITY_COORDINATES[fac.facility_id] || DISTRICT_COORDINATES[fac.district] || DEFAULT_MAP_CENTER)[1];
    setViewMode('map');
    setSelectedDistrict(fac.district);
    setMapCenter([lat, lng]);
    setMapZoom(13);
    setCurrentZoom(13);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 border border-stone-300/80 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" /> Unified Regional Map
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-stone-100 text-stone-600 border border-stone-200">
                Tamil Nadu Node & Camp Layer
              </span>
              <span className="text-xs text-stone-500 font-mono">OpenStreetMap Powered</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Donation Camps, Hospitals & Blood Banks
            </h2>
            <p className="text-sm text-stone-600 max-w-3xl mt-1">
              Explore voluntary blood donation drives, accredited hospitals, and regional blood banks. Zoom into any district to view all local facilities and available camps.
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-stone-100 p-1.5 rounded-2xl border border-stone-300 self-start lg:self-auto shrink-0 shadow-inner">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                viewMode === 'map'
                  ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MapIcon className="w-4 h-4 text-rose-600" /> Map View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                viewMode === 'list'
                  ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <List className="w-4 h-4 text-rose-600" /> Directory View ({campsCount + filteredFacilities.length})
            </button>
          </div>
        </div>

        {/* Multi-Level Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4 border-t border-stone-200">
          
          {/* 1. DISTRICT FILTER */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-500 font-mono uppercase tracking-wider block">
              1. District / Region
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-800"
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d === 'ALL' ? '🌍 All Districts (State View)' : `📍 District: ${d}`}
                </option>
              ))}
            </select>
          </div>

          {/* 2. ENTITY TYPE FILTER */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-500 font-mono uppercase tracking-wider block">
              2. Map Layer / Entity
            </label>
            <select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
              className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-800"
            >
              <option value="ALL">✨ All Locations (Camps + Facilities)</option>
              <option value="CAMP">⛺ Blood Donation Camps Only</option>
              <option value="HOSPITAL">🏥 Hospitals Only</option>
              <option value="BLOOD_BANK">🏢 Blood Banks Only</option>
              <option value="FACILITIES">🏥🏢 All Facilities (No Camps)</option>
            </select>
          </div>

          {/* 3. BLOOD GROUP FILTER */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-500 font-mono uppercase tracking-wider block">
              3. Blood Group Needed
            </label>
            <select
              value={selectedBloodGroup}
              onChange={(e) => setSelectedBloodGroup(e.target.value)}
              className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-800"
            >
              <option value="ALL">🩸 All Blood Groups</option>
              <option value="O+">O+ Needed</option>
              <option value="O-">O- (Universal Red Cell)</option>
              <option value="A+">A+ Needed</option>
              <option value="A-">A- Needed</option>
              <option value="B+">B+ Needed</option>
              <option value="B-">B- Needed</option>
              <option value="AB+">AB+ Needed</option>
              <option value="AB-">AB- (Rare Group)</option>
            </select>
          </div>

          {/* 4. URGENCY / STATUS FILTER */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-500 font-mono uppercase tracking-wider block">
              4. Drive Urgency & Status
            </label>
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-800"
            >
              <option value="ALL">All Urgencies & Drives</option>
              <option value="CRITICAL">🚨 Critical Need Drives</option>
              <option value="ACTIVE">🟢 Active / Ongoing Today</option>
              <option value="UPCOMING">Upcoming Drives</option>
            </select>
          </div>

          {/* 5. SEARCH INPUT */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <label className="text-[11px] font-bold text-stone-500 font-mono uppercase tracking-wider block">
              5. Quick Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search camp, hospital, venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-800 placeholder-stone-400"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Context Header & Results Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-stone-500 font-medium">Quick Layer Filter:</span>
            
            <button
              onClick={() => setSelectedEntityType('ALL')}
              className={`px-3 py-1 rounded-xl font-bold transition flex items-center gap-1.5 ${
                selectedEntityType === 'ALL'
                  ? 'bg-stone-900 text-white shadow'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <span>All</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                {campsCount + hospitalsCount + bloodBanksCount}
              </span>
            </button>

            <button
              onClick={() => setSelectedEntityType('CAMP')}
              className={`px-3 py-1 rounded-xl font-bold transition flex items-center gap-1.5 ${
                selectedEntityType === 'CAMP'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/20'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <span>⛺ Camps</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/30 text-[10px]">
                {campsCount}
              </span>
            </button>

            <button
              onClick={() => setSelectedEntityType('HOSPITAL')}
              className={`px-3 py-1 rounded-xl font-bold transition flex items-center gap-1.5 ${
                selectedEntityType === 'HOSPITAL'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <span>🏥 Hospitals</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/30 text-[10px]">
                {hospitalsCount}
              </span>
            </button>

            <button
              onClick={() => setSelectedEntityType('BLOOD_BANK')}
              className={`px-3 py-1 rounded-xl font-bold transition flex items-center gap-1.5 ${
                selectedEntityType === 'BLOOD_BANK'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <span>🏢 Blood Banks</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/30 text-[10px]">
                {bloodBanksCount}
              </span>
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-600 font-mono">
            <span className="font-bold text-stone-700">Map Legend:</span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block" />
              <span>🚨 Critical Need Camp</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>🟢 Active Today</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>🏥 Hospital</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span>🏢 Blood Bank</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main View: Leaflet Map or List Directory */}
      {viewMode === 'map' ? (
        <div className="bg-white rounded-3xl overflow-hidden border border-stone-300 shadow-md relative h-[650px] z-10">
          
          {/* FLOATING ZOOM / DISTRICT CONTEXT BANNER */}
          {!isDistrictZoomed ? (
            <div className="absolute top-3 left-14 z-[400] bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-stone-300 shadow-lg text-xs flex items-center gap-2.5 max-w-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0 inline-block" />
              <div className="text-stone-800">
                <strong className="text-red-700 font-extrabold uppercase tracking-wide">State Emergency View:</strong>{' '}
                <span>Showing critical emergency blood drives across Tamil Nadu. Click any district hub below or select a district to reveal all local hospitals and scheduled camps.</span>
              </div>
            </div>
          ) : (
            <div className="absolute top-3 left-14 z-[400] bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-stone-300 shadow-lg text-xs flex items-center justify-between gap-3 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-stone-800">
                  <strong className="text-stone-900 font-bold">
                    {selectedDistrict !== 'ALL' ? `District: ${selectedDistrict}` : 'District Detail View'}
                  </strong>{' '}
                  <span className="text-stone-500 font-mono text-[11px]">
                    ({mapCampsToRender.length} Camps • {filteredFacilities.length} Facilities)
                  </span>
                </span>
              </div>
              <button
                onClick={() => handleDistrictChange('ALL')}
                className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[11px] transition border border-stone-300 flex items-center gap-1 shrink-0"
              >
                <RotateCcw className="w-3 h-3 text-stone-500" />
                <span>State View</span>
              </button>
            </div>
          )}

          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="w-full h-full"
            style={{ background: '#f5f5f4' }}
          >
            <MapController
              center={mapCenter}
              zoom={mapZoom}
              onZoomChange={handleZoomChange}
            />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | BloodChain'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* A. STATE OVERVIEW MODE (Not Zoomed In): RENDER DISTRICT HUBS */}
            {!isDistrictZoomed && districtClusters.map((cluster) => (
              <Marker
                key={`hub-${cluster.districtName}`}
                position={cluster.coords}
                icon={createDistrictClusterMarker(cluster)}
                eventHandlers={{
                  click: () => {
                    handleDistrictChange(cluster.districtName);
                  },
                }}
              >
                <Popup className="bloodchain-custom-popup">
                  <div className="p-2 space-y-2.5 max-w-xs font-sans">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                      <span className="text-xs font-extrabold text-stone-900">{cluster.districtName} Medical Hub</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                        {cluster.facilityCount} Nodes
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-stone-600">
                      <div className="flex items-center justify-between">
                        <span>🏥 Hospitals:</span>
                        <strong className="text-stone-900">{cluster.hospitalCount}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>🏢 Blood Banks:</span>
                        <strong className="text-stone-900">{cluster.bloodBankCount}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>⛺ Scheduled Camps:</span>
                        <strong className="text-stone-900">
                          {cluster.campsCount} {cluster.criticalCampsCount > 0 ? `(${cluster.criticalCampsCount} Critical Need)` : ''}
                        </strong>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDistrictChange(cluster.districtName)}
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/20"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Zoom Into {cluster.districtName}</span>
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* B. CAMPS LAYER:
                - If State View: ONLY Critical Need camps are rendered!
                - If District Zoomed: All available camps in that district are rendered! */}
            {mapCampsToRender.map((camp) => {
              const isRegistered = isDonorRegisteredForCamp(camp.camp_id);
              return (
                <Marker
                  key={`camp-${camp.camp_id}`}
                  position={[camp.latitude, camp.longitude]}
                  icon={createCampMarker(camp, isRegistered)}
                >
                  <Popup className="bloodchain-custom-popup">
                    <div className="p-1 space-y-2 max-w-xs font-sans">
                      <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          camp.urgency === 'CRITICAL'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : camp.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          ⛺ {camp.urgency === 'CRITICAL' ? 'CRITICAL CAMP' : camp.status}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {camp.organizer_type === 'BLOOD_BANK' ? 'Blood Bank Drive' : 'Hospital Drive'}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-stone-900 text-sm leading-snug">
                        {camp.camp_name}
                      </h4>

                      {/* Venue & Organizer Details */}
                      <div className="space-y-1.5 text-xs">
                        <div className="bg-stone-50 p-2 rounded-xl border border-stone-200">
                          <span className="text-[10px] text-stone-400 font-mono block uppercase font-bold">Venue Location</span>
                          <span className="font-semibold text-stone-800 flex items-start gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span>{camp.venue_name}, {camp.venue_address}</span>
                          </span>
                        </div>

                        <div className="text-[11px] text-stone-600 px-1">
                          <span className="font-semibold text-stone-700">Organized by:</span> {camp.organizer_name}
                        </div>

                        <div className="text-[11px] text-stone-600 px-1 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          <span>{formatDate(camp.start_datetime)} ({formatTime(camp.start_datetime)} – {formatTime(camp.end_datetime)})</span>
                        </div>
                      </div>

                      {/* Required Blood Groups */}
                      {camp.required_blood_groups?.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[10px] text-stone-500 font-mono block font-semibold">Needed Groups:</span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {camp.required_blood_groups.map((bg) => (
                              <span key={bg} className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold font-mono">
                                {bg}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Registration Action / Status */}
                      <div className="pt-2">
                        {isRegistered ? (
                          <div className="w-full py-1.5 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>You are Pre-Registered</span>
                          </div>
                        ) : camp.status !== 'COMPLETED' ? (
                          <button
                            onClick={() => setActiveCampForModal(camp)}
                            className="w-full py-2 px-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl text-xs font-bold transition text-center shadow-md shadow-rose-900/20"
                          >
                            Register for Camp
                          </button>
                        ) : (
                          <div className="py-1 text-center text-[10px] font-mono text-stone-500 bg-stone-100 rounded-lg">
                            Camp Completed
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* C. DISTRICT DETAIL MODE: RENDER INDIVIDUAL HOSPITALS & BLOOD BANKS WHEN ZOOMED IN */}
            {isDistrictZoomed && filteredFacilities.map((fac) => {
              const isBloodBank = fac.facility_type === 'BLOOD_BANK';
              const lat = fac.latitude || (FACILITY_COORDINATES[fac.facility_id] || DISTRICT_COORDINATES[fac.district] || DEFAULT_MAP_CENTER)[0];
              const lng = fac.longitude || (FACILITY_COORDINATES[fac.facility_id] || DISTRICT_COORDINATES[fac.district] || DEFAULT_MAP_CENTER)[1];
              const facilityCamps = getCampsForFacility(fac.facility_id);

              return (
                <Marker
                  key={`facility-${fac.facility_id}`}
                  position={[lat, lng]}
                  icon={
                    isBloodBank
                      ? createBloodBankMarker(fac, facilityCamps.length)
                      : createHospitalMarker(fac, facilityCamps.length)
                  }
                >
                  <Popup className="bloodchain-custom-popup">
                    <div className="p-1 space-y-2.5 max-w-xs font-sans">
                      <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isBloodBank
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {isBloodBank ? '🏢 REGIONAL BLOOD BANK' : '🏥 ACCREDITED HOSPITAL'}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {fac.facility_id}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-stone-900 text-sm leading-snug">
                        {fac.name}
                      </h4>

                      <div className="space-y-1 text-xs">
                        <div className="bg-stone-50 p-2 rounded-xl border border-stone-200">
                          <span className="text-[10px] text-stone-400 font-mono block uppercase font-bold">District / Address</span>
                          <span className="font-semibold text-stone-800 flex items-start gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                            <span>{fac.address || `${fac.district}, Tamil Nadu`}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-medium pt-0.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Accredited State Node • Live Ledger Connected</span>
                        </div>
                      </div>

                      {/* Active Camps Organized by this Facility */}
                      {facilityCamps.length > 0 ? (
                        <div className="pt-1.5 border-t border-stone-200 space-y-1.5">
                          <span className="text-[10px] font-bold text-stone-600 uppercase font-mono block">
                            Organized Donation Camps ({facilityCamps.length})
                          </span>
                          {facilityCamps.slice(0, 2).map((camp) => (
                            <div key={camp.camp_id} className="bg-rose-50/70 p-2 rounded-xl border border-rose-200 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-stone-900 truncate max-w-[170px]">{camp.camp_name}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-rose-200 text-rose-900">{camp.status}</span>
                              </div>
                              <p className="text-[10px] text-stone-600">{formatDate(camp.start_datetime)} • {camp.venue_name}</p>
                              <button
                                onClick={() => setActiveCampForModal(camp)}
                                className="w-full py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition text-center shadow-xs"
                              >
                                Pre-Register for this Camp
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] text-stone-500 italic bg-stone-50 p-2 rounded-lg text-center">
                          Voluntary walk-in donations accepted at this node during operating hours.
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      ) : (
        /* List / Directory View */
        <div className="space-y-6">
          {/* Sub-Tabs in List View */}
          <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
            <span className="text-xs font-bold text-stone-500 font-mono uppercase tracking-wider mr-2">Directory:</span>
            <button
              onClick={() => setSelectedEntityType('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedEntityType === 'ALL'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              All Entities ({campsCount + hospitalsCount + bloodBanksCount})
            </button>
            <button
              onClick={() => setSelectedEntityType('CAMP')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedEntityType === 'CAMP'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-rose-50 hover:text-rose-700'
              }`}
            >
              Donation Camps ({campsCount})
            </button>
            <button
              onClick={() => setSelectedEntityType('HOSPITAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedEntityType === 'HOSPITAL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              Hospitals ({hospitalsCount})
            </button>
            <button
              onClick={() => setSelectedEntityType('BLOOD_BANK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedEntityType === 'BLOOD_BANK'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
            >
              Blood Banks ({bloodBanksCount})
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Render Camps */}
            {filteredCamps.map((camp) => {
              const isRegistered = isDonorRegisteredForCamp(camp.camp_id);

              return (
                <div
                  key={`card-camp-${camp.camp_id}`}
                  className="bg-white rounded-3xl p-5 border border-stone-300/80 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                        camp.urgency === 'CRITICAL'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : camp.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        ⛺ {camp.urgency === 'CRITICAL' ? 'CRITICAL NEED' : camp.status}
                      </span>
                      <span className="text-xs text-stone-400 font-mono font-medium">
                        {camp.organizer_type === 'BLOOD_BANK' ? 'Blood Bank' : 'Hospital'}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-stone-900 text-base leading-snug group-hover:text-rose-700 transition">
                      {camp.camp_name}
                    </h3>

                    <div className="space-y-1.5 text-xs text-stone-600">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-stone-800">{camp.venue_name}</strong>
                          <p className="text-[11px] text-stone-500 line-clamp-1">{camp.venue_address}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-stone-500">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Organizer: <strong>{camp.organizer_name}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5 text-stone-500">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatDate(camp.start_datetime)} • {formatTime(camp.start_datetime)} – {formatTime(camp.end_datetime)}</span>
                      </div>

                      {camp.max_donors && (
                        <div className="flex items-center gap-1.5 text-stone-500">
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          <span>{camp.registered_count} registered / {camp.max_donors} capacity</span>
                        </div>
                      )}
                    </div>

                    {camp.required_blood_groups?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {camp.required_blood_groups.map((bg) => (
                          <span key={bg} className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold font-mono">
                            {bg}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-stone-100 mt-4 flex items-center gap-2">
                    {isRegistered ? (
                      <div className="w-full py-2 px-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Pre-Registered</span>
                      </div>
                    ) : camp.status !== 'COMPLETED' ? (
                      <button
                        onClick={() => setActiveCampForModal(camp)}
                        className="flex-1 py-2 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs transition shadow-sm text-center"
                      >
                        Register for Camp
                      </button>
                    ) : (
                      <div className="w-full py-2 text-center text-xs font-mono text-stone-400 bg-stone-50 rounded-2xl">
                        Camp Completed
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setViewMode('map');
                        setSelectedDistrict(camp.organizer_district || 'ALL');
                        setMapCenter([camp.latitude, camp.longitude]);
                        setMapZoom(13);
                        setCurrentZoom(13);
                      }}
                      title="View on Map"
                      className="p-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                    >
                      <MapIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Render Facilities */}
            {filteredFacilities.map((fac) => {
              const isBloodBank = fac.facility_type === 'BLOOD_BANK';
              const facilityCamps = getCampsForFacility(fac.facility_id);

              return (
                <div
                  key={`card-fac-${fac.facility_id}`}
                  className="bg-white rounded-3xl p-5 border border-stone-300/80 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                        isBloodBank
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {isBloodBank ? '🏢 BLOOD BANK' : '🏥 HOSPITAL NODE'}
                      </span>
                      <span className="text-xs text-stone-400 font-mono font-medium">
                        {fac.facility_id}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-stone-900 text-base leading-snug group-hover:text-blue-700 transition">
                      {fac.name}
                    </h3>

                    <div className="space-y-1.5 text-xs text-stone-600">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-stone-800">{fac.district}, Tamil Nadu</strong>
                          <p className="text-[11px] text-stone-500 line-clamp-1">{fac.address || 'Accredited Medical Center'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Accredited Ledger Node</span>
                      </div>

                      {facilityCamps.length > 0 && (
                        <div className="flex items-center gap-1.5 text-rose-700 font-semibold pt-1">
                          <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                          <span>{facilityCamps.length} active donation drive(s) organized</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100 mt-4 flex items-center justify-between gap-2">
                    <button
                      onClick={() => focusFacilityOnMap(fac)}
                      className="flex-1 py-2 px-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      <span>Locate on Map</span>
                    </button>

                    {facilityCamps.length > 0 && (
                      <button
                        onClick={() => setActiveCampForModal(facilityCamps[0])}
                        className="py-2 px-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-sm"
                      >
                        Join Camp
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Registration Modal with Verifiable QR Pass */}
      {activeCampForModal && (
        <DonorCampModal
          camp={activeCampForModal}
          donor={donor}
          onClose={() => setActiveCampForModal(null)}
          onRegistered={() => {
            fetchMapData();
          }}
        />
      )}
    </div>
  );
};
