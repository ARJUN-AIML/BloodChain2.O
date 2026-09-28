import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { auth, signInWithEmailAndPassword } from '../../services/firebase';
import { TEST_FACILITIES } from '../../config/facilityCredentials';
import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const Login = ({ initialFacility }) => {
  const { profile, loginWithDevToken } = useAuth();

  const [email, setEmail] = useState(() => {
    if (initialFacility?.facility_id) {
      return `${initialFacility.facility_id.replace(/_/g, '-')}@bloodchain.demo`;
    }
    return '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [shakeEmail, setShakeEmail] = useState(false);
  const [shakePassword, setShakePassword] = useState(false);

  const handleAutofill = (testFacility) => {
    setEmail(testFacility.email);
    setPassword(testFacility.password);
    setEmailError('');
    setPasswordError('');
    setShakeEmail(false);
    setShakePassword(false);
  };

  const getPlainErrorMessage = (errCode, rawMessage) => {
    // Plain error messages without mentioning Firebase
    switch (errCode) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'The password you entered is incorrect.';
      case 'auth/user-not-found':
        return 'No accredited facility found with this email.';
      case 'auth/invalid-email':
        return 'Please enter a valid institutional email.';
      case 'auth/network-request-failed':
        return 'Network connection error. Check your connection.';
      case 'auth/too-many-requests':
        return 'Access temporarily blocked due to repeated failed attempts. Please try again later.';
      default:
        if (rawMessage?.toLowerCase().includes('password')) {
          return 'The password you entered is incorrect.';
        }
        if (rawMessage?.toLowerCase().includes('user') || rawMessage?.toLowerCase().includes('email')) {
          return 'No accredited facility found with this email.';
        }
        return 'Unable to sign in. Please verify your credentials.';
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setShakeEmail(false);
    setShakePassword(false);

    const cleanEmail = email.trim();
    let hasError = false;

    if (!cleanEmail) {
      setEmailError('Please enter your facility email.');
      setShakeEmail(true);
      hasError = true;
    } else if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setEmailError('Please enter a valid institutional email.');
      setShakeEmail(true);
      hasError = true;
    }

    if (!password) {
      setPasswordError('Please enter your password.');
      setShakePassword(true);
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate against Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const idToken = await userCredential.user.getIdToken();

      // 2. Transmit verified token to backend session handler
      await loginWithDevToken(idToken);
    } catch (err) {
      console.debug('Sign in note:', err);

      const msg = getPlainErrorMessage(err.code, err.message);

      // Check if credentials match accredited test nodes
      const lower = cleanEmail.toLowerCase();
      const testFacility = Object.values(TEST_FACILITIES).find(
        (f) => f.email.toLowerCase() === lower
      );

      // If wrong password, ALWAYS show password error and do not allow login
      if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential' ||
        (testFacility && testFacility.password !== password) ||
        msg.includes('password')
      ) {
        setPasswordError('The password you entered is incorrect.');
        setShakePassword(true);
        setLoading(false);
        return;
      }

      // Dev-token simulation fallback for local verified dataset nodes if cloud auth is unreachable
      const facId = lower.split('@')[0].replace('-', '_');
      if (facId && testFacility && testFacility.password === password) {
        try {
          const devToken = `dev-token-${facId}`;
          await loginWithDevToken(devToken);
          setLoading(false);
          return;
        } catch (devErr) {
          console.debug('Dev token fallback note:', devErr);
        }
      }

      if (err.code === 'auth/user-not-found' || msg.includes('email') || msg.includes('found')) {
        setEmailError(msg);
        setShakeEmail(true);
      } else {
        setEmailError(msg);
        setShakeEmail(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-viewport-container">
      
      {/* SCOPED COMPONENT STYLES */}
      <style>{`
        :root {
          --bg-overlay: 0.04;
          --card-y-offset: 0px;
        }
        @media (min-width: 640px) {
          :root {
            --card-y-offset: 0px;
          }
        }
        @media (min-width: 1024px) {
          :root {
            --card-y-offset: 0px;
          }
        }

        .login-viewport-container {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          overflow-x: hidden;
          overflow-y: auto;
          background-color: #dbcfb9;
          background-image: 
            radial-gradient(ellipse at 50% 50%, rgba(225, 29, 72, 0.08) 0%, rgba(219, 207, 185, 0) 65%),
            linear-gradient(rgba(219, 207, 185, var(--bg-overlay)), rgba(219, 207, 185, 0.08)),
            url('/assets/hands-bg.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #1c1917;
        }

        /* Unboxed narrative text occupying side areas */
        .side-narrative-text {
          animation: textFadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes textFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Slightly transparent login credential card - background hand image is fully visible */
        .login-glass-card {
          background-color: rgba(235, 226, 210, 0.22);
          backdrop-filter: blur(2px) saturate(110%);
          -webkit-backdrop-filter: blur(2px) saturate(110%);
          border: 1px solid rgba(255, 255, 255, 0.55);
          border-radius: 20px;
          box-shadow: 0 20px 45px -12px rgba(70, 40, 20, 0.12), 0 0 24px -4px rgba(225, 29, 72, 0.06), 0 0 0 1px rgba(180, 160, 130, 0.20);
          margin-top: var(--card-y-offset);
          animation: cardFadeRise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes cardFadeRise {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .login-glass-card {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .shake-field {
            animation: none !important;
          }
        }

        .input-glow:focus {
          border-color: #e11d48 !important;
          box-shadow: 0 0 0 2px rgba(225, 29, 72, 0.25), 0 0 16px rgba(225, 29, 72, 0.14) !important;
        }

        /* Prevent browser blue/white flash on autofilled inputs */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
          -webkit-text-fill-color: #1c1917 !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .shake-field {
          animation: fieldShakeAnim 0.38s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        @keyframes fieldShakeAnim {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(3px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
      `}</style>

      {/* TOP BRAND HEADER (With official 3rd image logo, without Back to home button) */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3 select-none">
          <img 
            src="/assets/logo.png" 
            alt="BloodChain AI Logo" 
            className="w-9 h-9 rounded-xl shadow-md ring-1 ring-stone-900/10 object-cover"
          />
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-stone-900 leading-tight">
              BloodChain AI
            </span>
            <span className="text-[10px] font-medium text-stone-600 font-mono leading-tight">
              Tamil Nadu Regional Blood Supply System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/75 border border-stone-300/80 backdrop-blur-md text-[11px] font-mono text-stone-700 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#2d1b14] animate-pulse"></span>
          <span className="font-semibold text-[#2d1b14]">50 State Nodes Live</span>
        </div>
      </header>

      {/* MAIN STAGE: LEFT SIDE PROMINENT TEXT + CENTER TRANSLUCENT CREDENTIAL CARD */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 sm:px-10 py-2 grid grid-cols-1 lg:grid-cols-12 items-center gap-6 lg:gap-8 z-10 my-auto">
        
        {/* LEFT SIDE AREA: Sacred Blood Lifeline Narrative (Unboxed, positioned comfortably down in the open gap) */}
        <div className="w-full max-w-xl lg:max-w-none lg:col-span-4 xl:col-span-4 space-y-4 sm:space-y-4.5 text-left lg:self-start lg:mt-16 xl:mt-20 side-narrative-text">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-600/10 border border-rose-500/25 text-rose-800 text-xs sm:text-sm font-mono font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
            <span>Every Drop a Lifeline • The Sacred Gift</span>
          </div>

          <h2 className="text-3xl sm:text-4xl xl:text-[42px] font-black tracking-tight text-stone-900 font-sans leading-[1.12]">
            Connecting Lifelines <br className="hidden sm:inline" />
            Across <span className="text-rose-700">Tamil Nadu.</span>
          </h2>

          <div className="relative pl-3.5 border-l-3 border-rose-600 py-1">
            <p className="text-base sm:text-lg font-serif italic text-stone-900 leading-snug">
              “In the space between two reaching hands lies humanity's greatest act of solidarity: the gift of blood. One hand gives freely of life; the other clings to hope.”
            </p>
          </div>
        </div>

        {/* Center Stage: Slightly Transparent Login Credential Card - Hands visible through it */}
        <div className="lg:col-span-4 lg:col-start-5 xl:col-span-4 xl:col-start-5 flex justify-center w-full">
          <div className="w-full max-w-[395px] login-glass-card p-5 sm:p-6 space-y-3.5">
            
            {/* Heading and Lead */}
            <div className="space-y-0.5 text-left">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 font-sans">
                Facility sign in
              </h1>
              <p className="text-xs text-stone-600">
                For accredited hospitals and blood banks.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3" noValidate autoComplete="off">
              
              {/* Facility Email */}
              <div className="space-y-1 text-left">
                <label htmlFor="facility-email" className="block text-xs font-semibold text-stone-800">
                  Facility email
                </label>
                <div className={shakeEmail ? 'shake-field' : ''}>
                  <input
                    id="facility-email"
                    name="facility_access_email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="hospital@bloodchain.tn.gov"
                    autoComplete="off"
                    required
                    disabled={loading}
                    className={`w-full px-3.5 py-2 rounded-xl bg-white/50 hover:bg-white/70 focus:bg-white/90 border ${
                      emailError ? 'border-rose-500' : 'border-stone-400/50'
                    } text-xs text-stone-900 placeholder-stone-500 outline-none transition-all input-glow shadow-xs backdrop-blur-xs`}
                  />
                </div>
                {emailError && (
                  <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 pt-0.5" role="alert">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1 text-left">
                <label htmlFor="facility-password" className="block text-xs font-semibold text-stone-800">
                  Password
                </label>
                <div className={`relative ${shakePassword ? 'shake-field' : ''}`}>
                  <input
                    id="facility-password"
                    name="facility_access_code"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                    className={`w-full pl-3.5 pr-10 py-2 rounded-xl bg-white/50 hover:bg-white/70 focus:bg-white/90 border ${
                      passwordError ? 'border-rose-500' : 'border-stone-400/50'
                    } text-xs text-stone-900 placeholder-stone-500 outline-none transition-all input-glow font-mono shadow-xs backdrop-blur-xs`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 p-1 rounded transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 pt-0.5" role="alert">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              {/* Primary Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#e11d48] to-[#dc2626] hover:from-[#f43f5e] hover:to-[#ef4444] text-white text-xs font-semibold shadow-lg shadow-rose-900/25 hover:shadow-rose-900/45 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-75 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                ) : (
                  <>
                    <span>Enter Facility Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

            </form>

            {/* Divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-400/35"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
                <span className="bg-[#ede4d3]/70 px-2.5 text-stone-600 font-semibold rounded backdrop-blur-xs border border-stone-300/40">
                  Quick facility sign-in test
                </span>
              </div>
            </div>

            {/* Quick Facility Sign-In Test Buttons */}
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleAutofill(TEST_FACILITIES.RGGGH_CHENNAI)}
                className="w-full py-2 px-3 rounded-lg bg-white/55 hover:bg-white/85 border border-stone-300/70 hover:border-rose-400 text-left transition-colors cursor-pointer group flex items-center justify-between shadow-2xs backdrop-blur-xs"
              >
                <div className="truncate text-left">
                  <span className="text-[11px] font-semibold text-stone-900 group-hover:text-rose-600 transition-colors block truncate">
                    {TEST_FACILITIES.RGGGH_CHENNAI.label}
                  </span>
                  <span className="text-[10px] font-mono text-stone-600 block truncate">
                    {TEST_FACILITIES.RGGGH_CHENNAI.email}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold text-[#2d1b14] bg-[#ede5d5] border border-[#c4b59f] px-1.5 py-0.5 rounded flex-shrink-0 ml-2">
                  FILL
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleAutofill(TEST_FACILITIES.APOLLO_CHENNAI)}
                className="w-full py-2 px-3 rounded-lg bg-white/55 hover:bg-white/85 border border-stone-300/70 hover:border-rose-400 text-left transition-colors cursor-pointer group flex items-center justify-between shadow-2xs backdrop-blur-xs"
              >
                <div className="truncate text-left">
                  <span className="text-[11px] font-semibold text-stone-900 group-hover:text-rose-600 transition-colors block truncate">
                    {TEST_FACILITIES.APOLLO_CHENNAI.label}
                  </span>
                  <span className="text-[10px] font-mono text-stone-600 block truncate">
                    {TEST_FACILITIES.APOLLO_CHENNAI.email}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold text-[#2d1b14] bg-[#ede5d5] border border-[#c4b59f] px-1.5 py-0.5 rounded flex-shrink-0 ml-2">
                  FILL
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleAutofill(TEST_FACILITIES.INDIAN_VOLUNTARY_BANK)}
                className="w-full py-2 px-3 rounded-lg bg-white/55 hover:bg-white/85 border border-stone-300/70 hover:border-rose-400 text-left transition-colors cursor-pointer group flex items-center justify-between shadow-2xs backdrop-blur-xs"
              >
                <div className="truncate text-left">
                  <span className="text-[11px] font-semibold text-stone-900 group-hover:text-rose-600 transition-colors block truncate">
                    {TEST_FACILITIES.INDIAN_VOLUNTARY_BANK.label}
                  </span>
                  <span className="text-[10px] font-mono text-stone-600 block truncate">
                    {TEST_FACILITIES.INDIAN_VOLUNTARY_BANK.email}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold text-[#2d1b14] bg-[#ede5d5] border border-[#c4b59f] px-1.5 py-0.5 rounded flex-shrink-0 ml-2">
                  FILL
                </span>
              </button>
            </div>

            {/* Footer Badge inside the card */}
            <div className="pt-2 border-t border-stone-300/60 flex items-center justify-center gap-1.5 text-[11px] font-mono text-[#2d1b14] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2d1b14]" />
              <span>Zero-Trust Verified</span>
            </div>

          </div>
        </div>

        {/* RIGHT SIDE AREA: Cold-Chain Network & Custody (Unboxed, without green badge) */}
        <div className="w-full max-w-lg lg:max-w-none lg:col-span-4 lg:col-start-9 xl:col-span-4 xl:col-start-9 space-y-3 text-left lg:self-end lg:mb-4 side-narrative-text">
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 font-sans leading-tight">
            Zero-Trust <span className="text-rose-700">Cold Chain.</span>
          </h3>

          <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-sans max-w-md lg:max-w-none">
            Continuous temperature-monitored bio-transit with end-to-end cryptographic traceability and real-time inventory allocation across regional facilities.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] sm:text-xs font-mono text-stone-800">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="font-semibold">50 Apex Nodes</span>
            </div>
            <span className="text-stone-400">•</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span className="font-semibold">Cold-Chain Guard</span>
            </div>
            <span className="text-stone-400">•</span>
            <div className="flex items-center gap-1.5 text-stone-600">
              <span>Verified Custody</span>
            </div>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="w-full pt-1 pb-4 text-center text-[10px] font-mono text-stone-600 z-10 pointer-events-none">
        BloodChain AI • Tamil Nadu Regional Blood Supply System
      </footer>

    </div>
  );
};

export default Login;
