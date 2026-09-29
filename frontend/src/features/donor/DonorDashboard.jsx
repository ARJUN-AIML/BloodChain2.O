import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { DonorHome } from './DonorHome';
import { DonorIdCard } from './DonorIdCard';
import { DonorCampMap } from './DonorCampMap';
import { DonorRegistrations } from './DonorRegistrations';
import { DonorDonations } from './DonorDonations';
import { DonorCertificates } from './DonorCertificates';
import { DonorAchievements } from './DonorAchievements';
import { DonorNotifications } from './DonorNotifications';
import { DonorProfile } from './DonorProfile';
import { 
  Home, 
  QrCode, 
  MapPin, 
  Calendar, 
  Clock, 
  Award, 
  FileCheck, 
  Bell, 
  User, 
  LogOut, 
  Droplet, 
  ShieldCheck,
  Menu,
  X,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { DonorIcon } from './DonorIcon';
import { HeartbeatLoader } from '../../components/HeartbeatLoader';

export const DonorDashboard = () => {
  const { profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchDonorProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/donors/me/');
      setDonor(res.data);

      // fetch unread notifications count
      try {
        const notifRes = await api.get('/donors/me/notifications/');
        const unread = notifRes.data?.filter((n) => !n.is_read).length || 0;
        setUnreadNotifications(unread);
      } catch (nErr) {
        // ignore
      }
    } catch (err) {
      console.error('Failed to load donor profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonorProfile();
  }, []);

  const navItems = [
    { id: 'home', label: 'Overview', icon: Home },
    { id: 'id_card', label: 'Digital ID Pass', icon: QrCode },
    { id: 'map', label: 'Camp Locator & Map', icon: MapPin },
    { id: 'registrations', label: 'My Registrations', icon: Calendar },
    { id: 'donations', label: 'Donation History', icon: Droplet },
    { id: 'certificates', label: 'Certificates', icon: FileCheck },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications },
    { id: 'profile', label: 'Profile Settings', icon: User },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Floating App Sub-Header */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-stone-300/80 shadow-sm flex items-center justify-between gap-4">
        {/* Donor Identity Bar */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-700 flex items-center justify-center text-white shadow-md shadow-rose-900/20 font-bold shrink-0">
            <DonorIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-stone-900 text-base">
                {donor?.name || profile?.name || 'BloodChain Donor'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
                {donor?.donor_id || 'BC-D-DONOR'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-mono">
              <span>Blood Group: <strong className="text-rose-700 font-bold">{donor?.blood_group || 'O+'}</strong></span>
              <span>•</span>
              <span>City: <strong>{donor?.city || 'Chennai'}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Camp Map Shortcut */}
          <button
            onClick={() => setActiveTab('map')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition border border-rose-200"
          >
            <MapPin className="w-3.5 h-3.5" /> Find Camps
          </button>

          {/* Quick ID Card Shortcut */}
          <button
            onClick={() => setActiveTab('id_card')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition border border-stone-300"
          >
            <QrCode className="w-3.5 h-3.5" /> My ID Pass
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Layout: Nav Tabs + Content View */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Desktop Navigation Sidebar / Pills */}
        <div className="hidden md:block w-64 shrink-0 space-y-1 bg-white/70 backdrop-blur-md p-3 rounded-3xl border border-stone-300/80 shadow-sm h-fit">
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-stone-400 font-semibold">
            Donor Workspace
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition group ${
                  active
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/20'
                    : 'text-stone-700 hover:bg-stone-100/80 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-stone-400 group-hover:text-stone-700'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      active ? 'bg-white text-rose-700' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Dropdown Nav Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white rounded-2xl p-3 border border-stone-300 shadow-lg space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    active ? 'bg-rose-600 text-white' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Dynamic Tab Content Display */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center p-6">
              <HeartbeatLoader 
                text="Synchronizing Donor Ledger..." 
                subtext="Verifying Regional Cryptographic Identity & Records" 
                size="md" 
              />
            </div>
          ) : (
            <>
              {activeTab === 'home' && (
                <DonorHome
                  donor={donor}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'id_card' && <DonorIdCard donor={donor} />}
              {activeTab === 'map' && <DonorCampMap donor={donor} />}
              {activeTab === 'registrations' && (
                <DonorRegistrations
                  donor={donor}
                  onNavigateToCertificates={() => setActiveTab('certificates')}
                />
              )}
              {activeTab === 'donations' && (
                <DonorDonations
                  donor={donor}
                  onNavigateToCertificates={() => setActiveTab('certificates')}
                />
              )}
              {activeTab === 'certificates' && <DonorCertificates donor={donor} />}
              {activeTab === 'achievements' && <DonorAchievements donor={donor} />}
              {activeTab === 'notifications' && (
                <DonorNotifications
                  donor={donor}
                  onNotificationCountChange={(count) => setUnreadNotifications(count)}
                />
              )}
              {activeTab === 'profile' && (
                <DonorProfile
                  donor={donor}
                  onProfileUpdated={(updated) => setDonor(updated)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;
