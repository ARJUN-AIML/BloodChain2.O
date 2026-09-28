import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  Award, 
  FileCheck, 
  Check, 
  CheckCheck,
  Info,
  Clock
} from 'lucide-react';

export const DonorNotifications = ({ donor, onNotificationCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/donors/me/notifications/');
      const data = res.data || [];
      setNotifications(data);
      if (onNotificationCountChange) {
        onNotificationCountChange(data.filter((n) => !n.is_read).length);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.post(`/donors/notifications/${id}/read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      if (onNotificationCountChange) {
        onNotificationCountChange((prevCount) => Math.max(0, prevCount - 1));
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    for (const n of unread) {
      markAsRead(n.id);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'EMERGENCY_CAMP':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'CAMP_REMINDER':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'CERTIFICATE_READY':
        return <FileCheck className="w-5 h-5 text-amber-600" />;
      case 'ACHIEVEMENT_UNLOCKED':
        return <Award className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-rose-600" />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.is_read;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-stone-300/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-max">
            <Bell className="w-3.5 h-3.5" /> Real-Time Alerts
          </span>
          <h2 className="text-2xl font-bold text-stone-900 mt-1">Notifications & Alerts</h2>
          <p className="text-sm text-stone-600">
            Emergency regional blood appeals, camp schedule reminders, and verified credentials.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filter === 'ALL' ? 'bg-white text-stone-900 shadow-sm font-semibold' : 'text-stone-600'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filter === 'UNREAD' ? 'bg-white text-stone-900 shadow-sm font-semibold' : 'text-stone-600'
              }`}
            >
              Unread ({notifications.filter((n) => !n.is_read).length})
            </button>
          </div>

          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition border border-stone-200"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-stone-400 font-mono text-sm">
          Loading alerts...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-300/80 shadow-sm space-y-3">
          <Bell className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-700">No Notifications</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            You are fully up-to-date. When nearby camps need your specific blood type, or when a certificate is ready, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition flex items-start justify-between gap-4 ${
                !item.is_read
                  ? 'bg-white border-rose-200 shadow-sm'
                  : 'bg-stone-50/60 border-stone-200/80 opacity-80'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    item.notification_type === 'EMERGENCY_CAMP'
                      ? 'bg-red-100'
                      : item.notification_type === 'CAMP_REMINDER'
                      ? 'bg-blue-100'
                      : item.notification_type === 'CERTIFICATE_READY'
                      ? 'bg-amber-100'
                      : 'bg-rose-100'
                  }`}
                >
                  {getIcon(item.notification_type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-stone-900">{item.title}</h4>
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                    )}
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                    {item.message}
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-mono pt-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                </div>
              </div>

              {!item.is_read && (
                <button
                  onClick={() => markAsRead(item.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
