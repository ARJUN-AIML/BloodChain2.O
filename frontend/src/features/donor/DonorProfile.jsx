import React, { useState } from 'react';
import api from '../../services/api';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  Droplet,
  Save,
  Lock
} from 'lucide-react';

export const DonorProfile = ({ donor, onProfileUpdated }) => {
  const [formData, setFormData] = useState({
    name: donor?.name || '',
    phone: donor?.phone || '',
    email: donor?.email || '',
    city: donor?.city || '',
    state: donor?.state || 'Tamil Nadu',
    address: donor?.address || '',
    date_of_birth: donor?.date_of_birth || '',
    gender: donor?.gender || 'M',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const res = await api.patch('/donors/me/', formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      if (onProfileUpdated) {
        onProfileUpdated(res.data);
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.response?.data?.detail || 'Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-stone-300/80 shadow-sm">
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          Account & Demographics
        </span>
        <h2 className="text-2xl font-bold text-stone-900 mt-1">Donor Profile Settings</h2>
        <p className="text-sm text-stone-600">
          Keep your contact coordinates up-to-date so camp organizers and blood banks can reach you in emergency shortages.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Static ID Badge Card */}
        <div className="bg-white rounded-3xl p-6 border border-stone-300/80 shadow-sm space-y-4 h-fit">
          <div className="text-center space-y-2 pb-4 border-b border-stone-200">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-red-600 text-white font-bold text-2xl mx-auto flex items-center justify-center shadow-lg shadow-rose-900/20">
              {donor?.name?.charAt(0) || 'D'}
            </div>
            <h3 className="text-lg font-bold text-stone-900">{donor?.name}</h3>
            <p className="text-xs font-mono text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 inline-block">
              {donor?.donor_id}
            </p>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-400">BLOOD GROUP:</span>
              <span className="font-bold text-rose-700 flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                {donor?.blood_group || 'O+'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-400">MEMBER SINCE:</span>
              <span className="text-stone-800">{donor?.member_since_year || 2026}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-400">TOTAL DONATIONS:</span>
              <span className="font-bold text-stone-900">{donor?.verified_donation_count || 0}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-400">STATUS:</span>
              <span className="text-emerald-700 font-bold">Active & Verified</span>
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-500 flex items-start gap-2">
            <Lock className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <span>
              Blood group and permanent Donor ID are verified by medical officers and cannot be altered online.
            </span>
          </div>
        </div>

        {/* Right 2 Cols: Editable Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-stone-300/80 shadow-sm">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 uppercase font-mono">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 uppercase font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 uppercase font-mono">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 uppercase font-mono">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 uppercase font-mono">
                  City
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 uppercase font-mono">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 uppercase font-mono">
                Residential Street Address
              </label>
              <textarea
                name="address"
                rows="3"
                value={formData.address}
                onChange={handleChange}
                placeholder="Door number, street name, locality, pincode..."
                className="w-full p-3 text-xs rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-stone-900"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-semibold text-xs transition flex items-center gap-2 shadow-md shadow-rose-900/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
