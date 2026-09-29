import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  QrCode, 
  Search, 
  Award, 
  FileCheck, 
  AlertTriangle, 
  Droplet, 
  X,
  ChevronRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const FacilityCampManagement = ({ facility: propFacility }) => {
  const { facility: authFacility } = useAuth() || {};
  const activeFacility = propFacility || authFacility;

  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active camp for managing registrations & check-in
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedDonorForVerify, setSelectedDonorForVerify] = useState(null);

  // Create Form State
  const [formData, setFormData] = useState({
    camp_name: '',
    camp_type: 'ROUTINE',
    urgency: 'NORMAL',
    venue_name: '',
    venue_address: '',
    city: 'Chennai',
    latitude: 13.0827,
    longitude: 80.2707,
    start_datetime: '',
    end_datetime: '',
    max_donors: 100,
    required_blood_groups: ['O+', 'A+'],
    description: '',
    contact_phone: '',
    contact_email: ''
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Check-In Form State
  const [checkInInput, setCheckInInput] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState(null);

  // Verify Donation Form State
  const [verifyData, setVerifyData] = useState({
    blood_unit_number: '',
    component_type: 'WHOLE_BLOOD',
    volume_ml: 450,
    hemoglobin: 13.5,
    notes: 'Standard healthy donation.'
  });
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState(null);

  // City coordinate presets for easy camp placement
  const cityPresets = [
    { city: 'Chennai (Central)', lat: 13.0827, lng: 80.2707 },
    { city: 'Chennai (Nungambakkam)', lat: 13.0558, lng: 80.2425 },
    { city: 'Chennai (Thousand Lights)', lat: 13.0604, lng: 80.2496 },
    { city: 'Coimbatore (Peelamedu)', lat: 11.0284, lng: 77.0279 },
    { city: 'Madurai (K.Pudur)', lat: 9.9252, lng: 78.1198 },
    { city: 'Salem (Meyyanur)', lat: 11.6643, lng: 78.1460 },
    { city: 'Tiruchirappalli (Cantonment)', lat: 10.7905, lng: 78.7047 },
  ];

  const fetchFacilityCamps = async () => {
    try {
      setLoading(true);
      setError(null);
      const fid = activeFacility?.facility_id;
      const url = fid ? `/camps/facility_camps/?facility_id=${fid}` : '/camps/facility_camps/';
      const res = await api.get(url);
      const campList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setCamps(campList);
      if (campList.length > 0) {
        selectCampForManagement(campList[0]);
      } else {
        setSelectedCamp(null);
        setRegistrations([]);
      }
    } catch (err) {
      console.error('Failed to load facility camps:', err);
      setError('Unable to load facility donation camps.');
    } finally {
      setLoading(false);
    }
  };

  const selectCampForManagement = async (camp) => {
    setSelectedCamp(camp);
    try {
      setLoadingRegs(true);
      const res = await api.get(`/camps/${camp.camp_id}/registrations/`);
      setRegistrations(res.data || []);
    } catch (err) {
      console.error('Failed to fetch camp registrations:', err);
    } finally {
      setLoadingRegs(false);
    }
  };

  useEffect(() => {
    fetchFacilityCamps();
  }, [activeFacility?.facility_id]);

  const handleCityPresetChange = (presetName) => {
    const p = cityPresets.find((item) => item.city === presetName);
    if (p) {
      setFormData({
        ...formData,
        city: p.city.split(' ')[0],
        latitude: p.lat,
        longitude: p.lng
      });
    }
  };

  const handleCreateCamp = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setCreateError(null);

        // Validate dates
      if (!formData.start_datetime || !formData.end_datetime) {
        setCreateError('Please specify start and end dates/times.');
        return;
      }

      const payload = {
        ...formData,
        facility_id: activeFacility?.facility_id
      };
      const res = await api.post('/camps/create/', payload);
      setShowCreateModal(false);
      fetchFacilityCamps();
      selectCampForManagement(res.data);
    } catch (err) {
      console.error('Failed to create camp:', err);
      setCreateError(err.response?.data?.detail || 'Failed to create camp.');
    } finally {
      setCreating(false);
    }
  };

  const handleCheckInDonor = async (e) => {
    e.preventDefault();
    if (!checkInInput || !selectedCamp) return;

    try {
      setCheckingIn(true);
      setCheckInMessage(null);
      const res = await api.post(`/camps/${selectedCamp.camp_id}/check_in/`, {
        donor_id_or_token: checkInInput.trim(),
        donor_id: checkInInput.trim()
      });
      setCheckInMessage({ type: 'success', text: `Donor checked in successfully! (${res.data.donor_name || 'Donor'})` });
      setCheckInInput('');
      selectCampForManagement(selectedCamp);
    } catch (err) {
      setCheckInMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to check in donor.' });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleVerifyDonation = async (e) => {
    e.preventDefault();
    if (!selectedDonorForVerify || !selectedCamp) return;

    try {
      setVerifying(true);
      setVerifyMessage(null);
      const res = await api.post(`/camps/${selectedCamp.camp_id}/verify_donation/`, {
        donor_id: selectedDonorForVerify.donor_id || selectedDonorForVerify.donor?.donor_id,
        blood_group: selectedDonorForVerify.blood_group || selectedDonorForVerify.donor?.blood_group,
        units_donated: 1.0,
        notes: verifyData.notes,
        camp_id: selectedCamp.camp_id
      });

      setVerifyMessage({
        type: 'success',
        text: `Donation verified! Certificate ${res.data.certificate_id} auto-generated.`
      });

      setTimeout(() => {
        setShowVerifyModal(false);
        setVerifyMessage(null);
        selectCampForManagement(selectedCamp);
      }, 2000);
    } catch (err) {
      setVerifyMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to verify donation.' });
    } finally {
      setVerifying(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
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
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-max">
            <Building2 className="w-3.5 h-3.5" /> Facility Campaign Center
          </span>
          <h2 className="text-2xl font-bold text-stone-900 mt-1">Donation Camps & Reception Desk</h2>
          <p className="text-sm text-stone-600">
            Publish community drives, check in registered donors via QR, and issue certified donation records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 rounded-xl transition shadow-md shadow-rose-900/20"
          >
            <Plus className="w-4 h-4" /> Create New Camp
          </button>
          <button
            onClick={fetchFacilityCamps}
            className="p-2 rounded-xl text-stone-600 bg-stone-100 hover:bg-stone-200 border border-stone-300 transition"
            title="Refresh Camps"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-stone-400 font-mono text-sm">
          Loading facility campaigns...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
          {error}
        </div>
      ) : camps.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-300/80 shadow-sm space-y-3">
          <Building2 className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-700">No Camps Created by Your Facility</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Organize a mobile blood drive or hospital-based donation camp to mobilize voluntary donors in your district.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition shadow-sm"
          >
            Create First Camp
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Col: Camps List */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider px-1">
              Your Facility's Camps ({camps.length})
            </h3>

            {camps.map((camp) => {
              const isSelected = selectedCamp?.camp_id === camp.camp_id;

              return (
                <div
                  key={camp.camp_id}
                  onClick={() => selectCampForManagement(camp)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? 'bg-rose-50/70 border-rose-400 shadow-sm'
                      : 'bg-white border-stone-200/80 hover:border-stone-300 hover:bg-stone-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      camp.urgency === 'CRITICAL'
                        ? 'bg-red-100 text-red-800'
                        : camp.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {camp.status}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      {camp.camp_id}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-stone-900 leading-snug">
                    {camp.camp_name}
                  </h4>

                  <div className="text-xs text-stone-500 space-y-0.5">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">{camp.venue_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-stone-400 shrink-0" />
                      <span>{formatDate(camp.start_datetime)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] font-mono text-stone-600">
                    <span>{camp.registered_count || 0} registered</span>
                    <span className="text-emerald-700 font-bold">{camp.checked_in_count || 0} checked in</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right 2 Cols: Camp Management & Check-in Desk */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCamp ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-300/80 shadow-sm space-y-6">
                {/* Camp Active Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        {selectedCamp.camp_type}
                      </span>
                      <span className="text-xs font-mono text-stone-400">{selectedCamp.camp_id}</span>
                    </div>
                    <h3 className="text-xl font-bold text-stone-900 mt-1">{selectedCamp.camp_name}</h3>
                    <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      {selectedCamp.venue_name}, {selectedCamp.venue_address}
                    </p>
                  </div>

                  {/* Fast Check-In Trigger */}
                  <button
                    onClick={() => setShowCheckInModal(true)}
                    className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Check-In Reception Desk
                  </button>
                </div>

                {/* Donor Registrations Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                      <Users className="w-4 h-4 text-stone-500" /> Registered Donors ({registrations.length})
                    </h4>
                  </div>

                  {loadingRegs ? (
                    <div className="text-center py-8 text-stone-400 font-mono text-xs">
                      Loading registrations...
                    </div>
                  ) : registrations.length === 0 ? (
                    <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
                      No donors have registered for this camp yet. Donors can discover it on the public camp map.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-stone-100/80 text-stone-500 uppercase font-mono text-[10px] border-b border-stone-200">
                          <tr>
                            <th className="py-2.5 px-3">Donor Name</th>
                            <th className="py-2.5 px-3">Donor ID</th>
                            <th className="py-2.5 px-3">Blood Group</th>
                            <th className="py-2.5 px-3">Time Slot</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-mono">
                          {registrations.map((reg) => (
                            <tr key={reg.id} className="hover:bg-stone-50/80 transition">
                              <td className="py-3 px-3 font-sans font-bold text-stone-900">
                                {reg.donor_name || reg.donor?.name}
                              </td>
                              <td className="py-3 px-3 text-rose-700 font-bold">
                                {reg.donor_id || reg.donor?.donor_id}
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                                  {reg.blood_group || reg.donor?.blood_group || 'O+'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-stone-600 font-sans">
                                {reg.preferred_timeslot || 'General'}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  reg.status === 'CHECKED_IN'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : reg.status === 'COMPLETED'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-stone-100 text-stone-700'
                                }`}>
                                  {reg.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-sans">
                                {reg.status === 'CHECKED_IN' && (
                                  <button
                                    onClick={() => {
                                      setSelectedDonorForVerify(reg);
                                      setShowVerifyModal(true);
                                    }}
                                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                                  >
                                    Verify Donation
                                  </button>
                                )}
                                {reg.status === 'COMPLETED' && (
                                  <span className="text-xs text-purple-700 font-semibold flex items-center justify-end gap-1">
                                    <FileCheck className="w-3.5 h-3.5" /> Certified
                                  </span>
                                )}
                                {reg.status === 'REGISTERED' && (
                                  <button
                                    onClick={async () => {
                                      await api.post(`/camps/${selectedCamp.camp_id}/check_in/`, {
                                        donor_id_or_token: reg.donor_id || reg.donor?.donor_id
                                      });
                                      selectCampForManagement(selectedCamp);
                                    }}
                                    className="px-3 py-1 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-medium transition"
                                  >
                                    Check In
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 text-stone-500">
                Select a camp to manage registrations and donor check-ins.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE NEW CAMP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative my-8">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
              New Campaign
            </span>
            <h3 className="text-xl font-bold text-stone-900 mt-1 mb-4">
              Schedule Blood Donation Camp
            </h3>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCamp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
                  Camp Campaign Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apollo Community Life Drive"
                  value={formData.camp_name}
                  onChange={(e) => setFormData({ ...formData, camp_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
                    Drive Type
                  </label>
                  <select
                    value={formData.camp_type}
                    onChange={(e) => setFormData({ ...formData, camp_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 text-stone-900"
                  >
                    <option value="ROUTINE">Routine Drive</option>
                    <option value="EMERGENCY">Emergency Response</option>
                    <option value="SPECIAL">Special Awareness</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
                    Urgency
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 text-stone-900"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="CRITICAL">Critical Need (Pulsing Pin)</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              {/* Venue Coordinates & Preset */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 font-mono uppercase">
                    Map Venue Location
                  </span>
                  <select
                    onChange={(e) => handleCityPresetChange(e.target.value)}
                    className="text-[11px] py-1 px-2 rounded-lg bg-white border border-stone-300 text-stone-700"
                  >
                    <option value="">Quick Location Preset...</option>
                    {cityPresets.map((p) => (
                      <option key={p.city} value={p.city}>{p.city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Venue Facility / Hall Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Valluvar Kottam Exhibition Hall"
                    value={formData.venue_name}
                    onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-stone-300 text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Full Venue Street Address
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nungambakkam High Rd, Chennai"
                    value={formData.venue_address}
                    onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-stone-300 text-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <label className="block text-stone-500 mb-0.5">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 rounded-lg bg-white border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 mb-0.5">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 rounded-lg bg-white border border-stone-300"
                    />
                  </div>
                </div>
              </div>

              {/* Dates & Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_datetime}
                    onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.end_datetime}
                    onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
                  Target Units (Max Capacity)
                </label>
                <input
                  type="number"
                  value={formData.max_donors}
                  onChange={(e) => setFormData({ ...formData, max_donors: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 text-stone-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition shadow-md shadow-rose-900/20 disabled:opacity-50"
                >
                  {creating ? 'Publishing...' : 'Publish to Camp Map'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECK-IN RECEPTION MODAL */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative text-center">
            <button
              onClick={() => {
                setShowCheckInModal(false);
                setCheckInMessage(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white mx-auto flex items-center justify-center mb-3">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-stone-900">Reception Check-In Scanner</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
              Scan the donor's digital QR pass or enter their permanent BloodChain ID (e.g. BC-D-XXXXX).
            </p>

            {checkInMessage && (
              <div className={`my-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                checkInMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {checkInMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{checkInMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleCheckInDonor} className="mt-4 space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
                  Donor QR Token or BloodChain ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste QR UUID or enter BC-D-XXXXX"
                  value={checkInInput}
                  onChange={(e) => setCheckInInput(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-mono rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-500 text-stone-900"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={checkingIn}
                className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50"
              >
                {checkingIn ? 'Checking In...' : 'Confirm Arrival & Check-In'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VERIFY DONATION & ISSUE CERTIFICATE MODAL */}
      {showVerifyModal && selectedDonorForVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative text-left">
            <button
              onClick={() => {
                setShowVerifyModal(false);
                setVerifyMessage(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700"
            >
              ✕
            </button>

            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-max">
              <ShieldCheck className="w-3.5 h-3.5" /> Medical Officer Verification
            </span>

            <h3 className="text-xl font-bold text-stone-900 mt-2">
              Verify Donation & Issue Certificate
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Donor: <strong>{selectedDonorForVerify.donor_name || selectedDonorForVerify.donor?.name}</strong> ({selectedDonorForVerify.donor_id || selectedDonorForVerify.donor?.donor_id})
            </p>

            {verifyMessage && (
              <div className={`my-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                verifyMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {verifyMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{verifyMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleVerifyDonation} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
                  Blood Unit Bag Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BC-U-2026-8812"
                  value={verifyData.blood_unit_number}
                  onChange={(e) => setVerifyData({ ...verifyData, blood_unit_number: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-stone-50 border border-stone-300 text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
                    Component Type
                  </label>
                  <select
                    value={verifyData.component_type}
                    onChange={(e) => setVerifyData({ ...verifyData, component_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 text-stone-900"
                  >
                    <option value="WHOLE_BLOOD">Whole Blood</option>
                    <option value="PACKED_RED_BLOOD_CELLS">Packed Red Cells</option>
                    <option value="PLATELETS">Platelets</option>
                    <option value="PLASMA">Plasma</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
                    Volume (ml)
                  </label>
                  <input
                    type="number"
                    value={verifyData.volume_ml}
                    onChange={(e) => setVerifyData({ ...verifyData, volume_ml: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
                  Hemoglobin (g/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={verifyData.hemoglobin}
                  onChange={(e) => setVerifyData({ ...verifyData, hemoglobin: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
                  Staff Notes
                </label>
                <input
                  type="text"
                  value={verifyData.notes}
                  onChange={(e) => setVerifyData({ ...verifyData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 text-stone-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-md shadow-emerald-900/20 disabled:opacity-50"
                >
                  {verifying ? 'Signing...' : 'Sign & Issue Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilityCampManagement;
