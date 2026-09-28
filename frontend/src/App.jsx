import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './features/auth/Login';
import { HospitalPortalHub } from './features/hospital/HospitalPortalHub';
import { BloodBankDashboard } from './features/bloodbank/BloodBankDashboard';
import { Activity } from 'lucide-react';

const MainContent = () => {
  const { profile, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center space-y-4">
        <Activity className="w-10 h-10 text-rose-500 animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Loading BloodChain Facility Portal...</p>
      </div>
    );
  }

  if (!profile) {
    return <Login />;
  }

  if (['HOSPITAL', 'HOSPITAL_APPROVAL', 'HOSPITAL_LOGISTICS'].includes(role)) {
    return <HospitalPortalHub />;
  }

  if (role === 'BLOOD_BANK') {
    return <BloodBankDashboard />;
  }

  return (
    <div className="text-center py-20 text-slate-400">
      Unknown facility role: {role}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <MainContent />
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
