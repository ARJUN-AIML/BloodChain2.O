import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { auth, signInWithEmailAndPassword } from '../../services/firebase';
import api from '../../services/api';
import { TEST_FACILITIES } from '../../config/facilityCredentials';
import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Building2,
  Droplet,
  Heart,
  Sparkles,
  UserCheck,
  UserPlus
} from 'lucide-react';

export const Login = ({ initialFacility }) => {
  const { profile, loginWithDevToken } = useAuth();

  // Portal Type: 'FACILITY' or 'DONOR'
  const [portalType, setPortalType] = useState('FACILITY');

  // Donor Authentication States
  const [donorMode, setDonorMode] = useState('LOGIN'); // 'LOGIN' or 'REGISTER'
  const [donorIdentifier, setDonorIdentifier] = useState('');
  const [donorPassword, setDonorPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState('O+');
  const [regCity, setRegCity] = useState('Chennai');
  const [regPassword, setRegPassword] = useState('');
  const [donorLoading, setDonorLoading] = useState(false);
  const [donorError, setDonorError] = useState('');

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

  const handleDonorLogin = async (e) => {
    e.preventDefault();
    if (!donorIdentifier.trim()) {
      setDonorError('Please enter your email or permanent BloodChain Donor ID.');
      return;
    }
    if (!donorPassword) {
      setDonorError('Please enter your password.');
      return;
    }

    try {
      setDonorLoading(true);
      setDonorError('');
      const res = await api.post('/donors/login/', {
        identifier: donorIdentifier.trim(),
        password: donorPassword
      });
      if (res.data?.token) {
        await loginWithDevToken(res.data.token);
      }
    } catch (err) {
      setDonorError(err.response?.data?.detail || 'Invalid donor credentials. Please check your details.');
    } finally {
      setDonorLoading(false);
    }
  };

  const handleDonorRegister = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setDonorError('Please fill out all required registration fields.');
      return;
    }

    try {
      setDonorLoading(true);
      setDonorError('');
      const res = await api.post('/donors/register/', {
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        phone: regPhone.trim(),
        blood_group: regBloodGroup,
        city: regCity.trim() || 'Chennai'
      });
      if (res.data?.token) {
        await loginWithDevToken(res.data.token);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.email?.[0] || 'Registration failed.';
      setDonorError(msg);
    } finally {
      setDonorLoading(false);
    }
  };

  const handleQuickDonorLogin = async (token) => {
    try {
      setDonorLoading(true);
      setDonorError('');
      await loginWithDevToken(token);
    } catch (err) {
      setDonorError('Quick donor login failed. Please retry.');
    } finally {
      setDonorLoading(false);
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
          <div className="w-full max-w-[420px] login-glass-card p-5 sm:p-6 space-y-4">
            
            {/* Primary Portal Type Segmented Switcher */}
            <div className="flex p-1 rounded-xl bg-stone-200/80 border border-stone-300">
              <button
                type="button"
                onClick={() => {
                  setPortalType('FACILITY');
                  setDonorError('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  portalType === 'FACILITY'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Facility Portal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPortalType('DONOR');
                  setEmailError('');
                  setPasswordError('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  portalType === 'DONOR'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Donor Portal</span>
              </button>
            </div>

            {/* FACILITY PORTAL VIEW */}
            {portalType === 'FACILITY' ? (
              <>
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
                <div className="relative my-2.5">
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
              </>
            ) : (
              /* DONOR PORTAL VIEW */
              <>
                <div className="flex items-center justify-between border-b border-stone-300/60 pb-2">
                  <div className="text-left">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 font-sans">
                      {donorMode === 'LOGIN' ? 'Donor Sign In' : 'Donor Registration'}
                    </h1>
                    <p className="text-xs text-stone-600">
                      {donorMode === 'LOGIN' ? 'Access your permanent BloodChain ID.' : 'Register to get a unique BC-D-XXXXX ID.'}
                    </p>
                  </div>

                  {/* Sub-toggle: Sign In vs Register */}
                  <div className="flex bg-stone-200/60 p-0.5 rounded-lg text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setDonorMode('LOGIN');
                        setDonorError('');
                      }}
                      className={`px-2 py-1 rounded-md transition ${
                        donorMode === 'LOGIN' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDonorMode('REGISTER');
                        setDonorError('');
                      }}
                      className={`px-2 py-1 rounded-md transition ${
                        donorMode === 'REGISTER' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                      }`}
                    >
                      Register
                    </button>
                  </div>
                </div>

                {donorError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{donorError}</span>
                  </div>
                )}

                {donorMode === 'LOGIN' ? (
                  /* Donor Login Form */
                  <form onSubmit={handleDonorLogin} className="space-y-3 text-left">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-stone-800">
                        Email Address or Donor ID
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. BC-D-20992 or email"
                        value={donorIdentifier}
                        onChange={(e) => setDonorIdentifier(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-white/60 border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-stone-800">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={donorPassword}
                        onChange={(e) => setDonorPassword(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-white/60 border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={donorLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-semibold shadow-md shadow-rose-900/20 transition flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-75"
                    >
                      {donorLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Enter Donor Dashboard</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Donor Registration Form */
                  <form onSubmit={handleDonorRegister} className="space-y-2.5 text-left">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Arun Kumar"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white/60 border border-stone-300 text-xs text-stone-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700">Email *</label>
                        <input
                          type="email"
                          required
                          placeholder="arun@example.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-white/60 border border-stone-300 text-xs text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700">Phone</label>
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-white/60 border border-stone-300 text-xs text-stone-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700">Blood Group *</label>
                        <select
                          value={regBloodGroup}
                          onChange={(e) => setRegBloodGroup(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-white/60 border border-stone-300 text-xs text-stone-900 font-bold"
                        >
                          <option value="O+">O+ (Common)</option>
                          <option value="O-">O- (Universal Red)</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+ (Universal Plasma)</option>
                          <option value="AB-">AB- (Rare)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700">City</label>
                        <input
                          type="text"
                          placeholder="Chennai"
                          value={regCity}
                          onChange={(e) => setRegCity(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-white/60 border border-stone-300 text-xs text-stone-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700">Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="Minimum 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white/60 border border-stone-300 text-xs text-stone-900 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={donorLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-semibold shadow-md shadow-rose-900/20 transition flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-75"
                    >
                      {donorLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Generate Permanent Donor ID</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* 1-Click Donor Test Persona Buttons */}
                <div className="relative my-2.5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-400/35"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
                    <span className="bg-[#ede4d3]/70 px-2.5 text-stone-600 font-semibold rounded backdrop-blur-xs border border-stone-300/40">
                      1-Click Test Donor Accounts
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDonorLogin('dev-token-donor-001')}
                    className="w-full py-2 px-3 rounded-lg bg-white/55 hover:bg-white/85 border border-stone-300/70 hover:border-rose-400 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[11px] font-semibold text-stone-900 block">
                        Arun Kumar (BC-D-20992)
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        Blood: O+ • 4 Verified Donations • 4 Certificates
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                      ENTER
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDonorLogin('dev-token-donor-002')}
                    className="w-full py-2 px-3 rounded-lg bg-white/55 hover:bg-white/85 border border-stone-300/70 hover:border-rose-400 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[11px] font-semibold text-stone-900 block">
                        Priya Patel (BC-D-80415)
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        Blood: A+ • Checked-In at Apollo Active Camp
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                      ENTER
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDonorLogin('dev-token-donor-003')}
                    className="w-full py-2 px-3 rounded-lg bg-white/55 hover:bg-white/85 border border-stone-300/70 hover:border-rose-400 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[11px] font-semibold text-stone-900 block">
                        Anand Kumar (BC-D-78280)
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        Blood: AB- (Rare) • Newly Registered Donor
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                      ENTER
                    </span>
                  </button>
                </div>
              </>
            )}

            {/* Footer Badge inside the card */}
            <div className="pt-2 border-t border-stone-300/60 flex items-center justify-center gap-1.5 text-[11px] font-mono text-[#2d1b14] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2d1b14]" />
              <span>Zero-Trust Blockchain Ledger</span>
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
