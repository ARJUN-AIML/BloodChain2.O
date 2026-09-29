import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './features/auth/Login';
import { HospitalPortalHub } from './features/hospital/HospitalPortalHub';
import { BloodBankDashboard } from './features/bloodbank/BloodBankDashboard';
import { DonorDashboard } from './features/donor/DonorDashboard';
import { PublicDonorPassVerification } from './features/donor/PublicDonorPassVerification';
import { PublicCertificateVerify } from './features/donor/PublicCertificateVerify';
import { HeartbeatLoader } from './components/HeartbeatLoader';

const AppShell = () => {
  const { profile, role, loading } = useAuth();

  // Public verification routing
  const path = window.location.pathname;
  const search = window.location.search;
  const params = new URLSearchParams(search);

  const isCertVerify = 
    path.startsWith('/verify/certificate') || 
    params.has('verify_cert');

  const isDonorVerify = 
    !isCertVerify && (
      path.startsWith('/verify') || 
      params.has('verify_donor') || 
      params.has('token') ||
      (params.has('id') && (params.get('id').startsWith('BC-D-') || params.has('camp')))
    );

  if (isCertVerify) {
    const certToken = params.get('verify_cert') || path.split('/').pop();
    return (
      <div className="min-h-screen bg-[#dbcfb9] flex items-center justify-center p-4">
        <PublicCertificateVerify 
          certificateId={certToken} 
          onClose={() => { window.location.href = '/'; }} 
        />
      </div>
    );
  }

  if (isDonorVerify) {
    return <PublicDonorPassVerification onBackToApp={() => { window.location.href = '/'; }} />;
  }

  return (
    <div className="min-h-screen bg-[#dbcfb9] text-stone-900 flex flex-col">
      {profile && <Navbar />}
      <main className="flex-1">
        {loading ? (
          <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6">
            <HeartbeatLoader text="Loading BloodChain Portal..." />
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
