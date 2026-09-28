import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Activity, KeyRound, Building2, ArrowRight, AlertCircle } from 'lucide-react';

export const Login = () => {
  const { loginWithDevToken, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    
    // Resolve Firebase test account identity mapping
    let token = '';
    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail === 'hospitala@test' || cleanEmail === 'hospitala@test.bloodchain' || cleanEmail.includes('hosp-001')) {
      token = 'dev-token-hosp-001';
    } else if (cleanEmail === 'hospitalb@test' || cleanEmail === 'hospitalb@test.bloodchain' || cleanEmail.includes('hosp-002')) {
      token = 'dev-token-hosp-002';
    } else if (cleanEmail === 'bloodbanka@test' || cleanEmail === 'bloodbanka@test.bloodchain' || cleanEmail.includes('bb-001')) {
      token = 'dev-token-bb-001';
    } else if (cleanEmail === 'bloodbankb@test' || cleanEmail === 'bloodbankb@test.bloodchain' || cleanEmail.includes('bb-002')) {
      token = 'dev-token-bb-002';
    } else {
      // Default fallback token matching email format or generic dev token
      token = `dev-token-${cleanEmail.replace(/[^a-z0-9]/g, '')}`;
    }

    try {
      await loginWithDevToken(token);
    } catch (err) {
      setErrorMessage('Authentication failed. Please verify facility credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Ambient Glows */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-2">
            <Activity className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            BloodChain Authentication
          </h2>
          <p className="text-xs text-slate-400">
            Secure regional blood supply portal for Hospitals & Blood Banks
          </p>
        </div>

        {(errorMessage || authError) && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMessage || authError}</span>
          </div>
        )}

        {/* Firebase Email & Password Credentials Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Facility Email Identifier</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hospitalA@test"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
              <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 font-bold text-white text-sm shadow-lg shadow-rose-900/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Facility Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-[11px] text-slate-500 text-center border-t border-slate-800/80 pt-4">
          Test Credentials: <span className="text-slate-400 font-mono">hospitalA@test</span>, <span className="text-slate-400 font-mono">hospitalB@test</span>, <span className="text-slate-400 font-mono">bloodbankA@test</span>
        </div>
      </div>
    </div>
  );
};
