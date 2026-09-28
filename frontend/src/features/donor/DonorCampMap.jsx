import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
  Info
} from 'lucide-react';

// Fix Leaflet default icon issues in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom HTML Markers by status & organizer
const createCustomMarker = (camp) => {
  const isCritical = camp.urgency === 'CRITICAL';
  const isActive = camp.status === 'ACTIVE';
  const isCompleted = camp.status === 'COMPLETED';
  const isBloodBank = camp.organizer_type === 'BLOOD_BANK';

  let bgClass = 'bg-blue-600 text-white';
  let pulseHtml = '';

  if (isCritical) {
    bgClass = 'bg-red-600 text-white';
    pulseHtml = '<span class="absolute -inset-1 rounded-full bg-red-500 animate-ping opacity-75"></span>';
  } else if (isActive) {
    bgClass = 'bg-emerald-600 text-white';
    pulseHtml = '<span class="absolute -inset-1 rounded-full bg-emerald-500 animate-pulse opacity-50"></span>';
  } else if (isCompleted) {
    bgClass = 'bg-stone-500 text-stone-100';
  }

  const iconEmoji = isBloodBank ? '🩸' : '🏥';

  return L.divIcon({
    className: 'custom-camp-pin',
    html: `
      <div class="relative flex items-center justify-center cursor-pointer">
        ${pulseHtml}
        <div class="w-9 h-9 rounded-2xl ${bgClass} shadow-xl flex items-center justify-center text-sm font-bold border-2 border-white transform hover:scale-110 transition duration-200">
          ${iconEmoji}
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

export const DonorCampMap = ({ donor }) => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'ACTIVE' | 'UPCOMING'
  const [selectedOrganizer, setSelectedOrganizer] = useState('ALL'); // 'ALL' | 'HOSPITAL' | 'BLOOD_BANK'
  
  // Registration Modal
  const [activeCampForModal, setActiveCampForModal] = useState(null);

  // Fetch Camps
  const fetchCamps = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/camps/');
      if (res.data?.results) {
        setCamps(res.data.results);
      } else if (Array.isArray(res.data)) {
        setCamps(res.data);
      }
    } catch (err) {
      console.error('Error fetching camps:', err);
      setError('Unable to load donation camps. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, []);

  // Filter Logic
  const filteredCamps = camps.filter((camp) => {
    // Search match
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      !searchTerm ||
      camp.camp_name?.toLowerCase().includes(searchLower) ||
      camp.venue_name?.toLowerCase().includes(searchLower) ||
      camp.venue_address?.toLowerCase().includes(searchLower) ||
      camp.organizer_name?.toLowerCase().includes(searchLower);

    // Blood group filter
    const matchesBlood =
      selectedBloodGroup === 'ALL' ||
      (Array.isArray(camp.required_blood_groups) && 
       (camp.required_blood_groups.includes(selectedBloodGroup) || camp.required_blood_groups.length === 0));

    // Urgency / Status filter
    let matchesUrgency = true;
    if (selectedUrgency === 'CRITICAL') matchesUrgency = camp.urgency === 'CRITICAL';
    else if (selectedUrgency === 'ACTIVE') matchesUrgency = camp.status === 'ACTIVE';
    else if (selectedUrgency === 'UPCOMING') matchesUrgency = camp.status === 'UPCOMING';

    // Organizer filter
    const matchesOrg =
      selectedOrganizer === 'ALL' ||
      camp.organizer_type === selectedOrganizer;

    return matchesSearch && matchesBlood && matchesUrgency && matchesOrg;
  });

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

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-stone-300/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Interactive Camp Locator
              </span>
              <span className="text-xs text-stone-500 font-mono">OpenStreetMap Powered</span>
            </div>
            <h2 className="text-2xl font-bold text-stone-900">Donation Camps & Mobile Drives</h2>
            <p className="text-sm text-stone-600">
              Browse verified blood donation venues, check urgency levels, and pre-register your arrival slot.
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-300 self-start md:self-auto">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'map' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" /> Map View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'list' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List View ({filteredCamps.length})
            </button>
          </div>
        </div>

        {/* Search & Multi-Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-stone-200">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search camp, venue, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-800 placeholder-stone-400"
            />
          </div>

          {/* Blood Group Filter */}
          <div>
            <select
              value={selectedBloodGroup}
              onChange={(e) => setSelectedBloodGroup(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-800"
            >
              <option value="ALL">All Blood Groups Needed</option>
              <option value="O+">O+ Needed</option>
              <option value="O-">O- (Universal Red Cell)</option>
              <option value="A+">A+ Needed</option>
              <option value="A-">A- Needed</option>
              <option value="B+">B+ Needed</option>
              <option value="B-">B- Needed</option>
              <option value="AB+">AB+ Needed</option>
              <option value="AB-">AB- (Rare)</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div>
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-800"
            >
              <option value="ALL">All Urgency & Statuses</option>
              <option value="CRITICAL">🚨 Critical Need Only</option>
              <option value="ACTIVE">🟢 Active / Ongoing Today</option>
              <option value="UPCOMING">Upcoming Drives</option>
            </select>
          </div>

          {/* Organizer Filter */}
          <div>
            <select
              value={selectedOrganizer}
              onChange={(e) => setSelectedOrganizer(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-800"
            >
              <option value="ALL">All Organizers</option>
              <option value="HOSPITAL">Hospitals Only</option>
              <option value="BLOOD_BANK">Blood Banks Only</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-600 pt-2 font-mono">
          <span className="font-semibold text-stone-700">Map Legend:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-red-300 animate-pulse" /> Critical Urgency
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Active Today
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Upcoming
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-400" /> Completed (&lt;24h)
          </span>
        </div>
      </div>

      {/* Main View: Map or List */}
      {viewMode === 'map' ? (
        <div className="bg-white rounded-3xl overflow-hidden border border-stone-300 shadow-md relative h-[600px] z-10">
          <MapContainer
            center={[11.5, 78.6]}
            zoom={7}
            scrollWheelZoom={true}
            className="w-full h-full"
            style={{ background: '#f5f5f4' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filteredCamps.map((camp) => (
              <Marker
                key={camp.camp_id}
                position={[camp.latitude, camp.longitude]}
                icon={createCustomMarker(camp)}
              >
                <Popup className="bloodchain-custom-popup">
                  <div className="p-1 space-y-2 max-w-xs font-sans">
                    <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        camp.urgency === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {camp.status}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {camp.organizer_type === 'BLOOD_BANK' ? 'Blood Bank' : 'Hospital'}
                      </span>
                    </div>

                    <h4 className="font-bold text-stone-900 text-sm leading-snug">
                      {camp.camp_name}
                    </h4>

                    {/* Venue vs Organizer (strict compliance with specification) */}
                    <div className="space-y-1 text-xs">
                      <div className="bg-stone-50 p-2 rounded-lg border border-stone-200">
                        <span className="text-[10px] text-stone-400 font-mono block uppercase">Venue Location</span>
                        <span className="font-medium text-stone-800 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span>{camp.venue_name}, {camp.venue_address}</span>
                        </span>
                      </div>

                      <div className="text-[11px] text-stone-600 px-1">
                        <span className="font-semibold text-stone-700">Organized by:</span> {camp.organizer_name}
                      </div>

                      <div className="text-[11px] text-stone-600 px-1 flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>{formatDate(camp.start_datetime)} ({formatTime(camp.start_datetime)})</span>
                      </div>
                    </div>

                    {camp.required_blood_groups?.length > 0 && (
                      <div className="pt-1">
                        <span className="text-[10px] text-stone-500 font-mono block">Blood Groups Needed:</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {camp.required_blood_groups.map((bg) => (
                            <span key={bg} className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold font-mono">
                              {bg}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {camp.status !== 'COMPLETED' ? (
                      <button
                        onClick={() => setActiveCampForModal(camp)}
                        className="w-full mt-2 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition text-center shadow-sm"
                      >
                        Register for Camp
                      </button>
                    ) : (
                      <div className="mt-2 py-1 text-center text-[10px] font-mono text-stone-500 bg-stone-100 rounded">
                        Camp Completed (Archiving in 24h)
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCamps.map((camp) => (
            <div
              key={camp.camp_id}
              className="bg-white rounded-2xl p-5 border border-stone-300/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    camp.urgency === 'CRITICAL'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : camp.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {camp.urgency === 'CRITICAL' ? 'CRITICAL NEED' : camp.status}
                  </span>
                  <span className="text-xs text-stone-400 font-mono">
                    {camp.organizer_type === 'BLOOD_BANK' ? 'Blood Bank' : 'Hospital'}
                  </span>
                </div>

                <h3 className="font-bold text-stone-900 text-base leading-snug">
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
                    <span>{formatDate(camp.start_datetime)} • {formatTime(camp.start_datetime)} - {formatTime(camp.end_datetime)}</span>
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

              <div className="pt-4 border-t border-stone-100 mt-4">
                {camp.status !== 'COMPLETED' ? (
                  <button
                    onClick={() => setActiveCampForModal(camp)}
                    className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-semibold text-xs transition shadow-sm"
                  >
                    Register for Camp
                  </button>
                ) : (
                  <div className="py-2 text-center text-xs font-mono text-stone-400 bg-stone-50 rounded-xl">
                    Camp Completed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registration Modal */}
      {activeCampForModal && (
        <DonorCampModal
          camp={activeCampForModal}
          donor={donor}
          onClose={() => setActiveCampForModal(null)}
          onRegistered={() => {
            fetchCamps();
          }}
        />
      )}
    </div>
  );
};
