import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './features/auth/Login';
import { HospitalPortalHub } from './features/hospital/HospitalPortalHub';
import { BloodBankDashboard } from './features/bloodbank/BloodBankDashboard';
import { DonorDashboard } from './features/donor/DonorDashboard';
import { Activity } from 'lucide-react';

const AppShell = () => {
  const { profile, role, loading } = useAuth();

  return (
    <div className="min-h-screen bg-[#dbcfb9] text-stone-900 flex flex-col">
      {profile && <Navbar />}
      <main className="flex-1">
        {loading ? (
          <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center space-y-4">
            <Activity className="w-10 h-10 text-rose-500 animate-spin" />
            <p className="text-xs text-slate-400 font-mono">Loading BloodChain Facility Portal...</p>
          </div>
        ) : !profile ? (
          <Login />
        ) : role === 'DONOR' ? (
          <DonorDashboard />
        ) : ['HOSPITAL', 'HOSPITAL_APPROVAL', 'HOSPITAL_LOGISTICS'].includes(role) ? (
          <HospitalPortalHub />
        ) : role === 'BLOOD_BANK' ? (
          <BloodBankDashboard />
        ) : (
          <div className="text-center py-20 text-slate-400">
            Unknown portal role: {role}
          </div>
        )}
      </main>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
