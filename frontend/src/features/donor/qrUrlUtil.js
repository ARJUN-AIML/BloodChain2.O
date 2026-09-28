/**
 * Utility to generate public verification URLs for BloodChain QR Codes.
 * Ensures production QR codes point to a publicly accessible HTTPS domain
 * and NOT localhost, 127.0.0.1, or local network IPs.
 */

export const getPublicAppBaseUrl = () => {
  const envUrl = import.meta.env.VITE_PUBLIC_APP_URL || import.meta.env.PUBLIC_APP_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    // If it's a valid remote URL (not localhost), use it
    if (!trimmed.includes('localhost') && !trimmed.includes('127.0.0.1')) {
      return trimmed;
    }
  }

  // If running in browser on a production domain (e.g. *.web.app, *.firebaseapp.com, or custom domain)
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const origin = window.location.origin;
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1') && !origin.includes('0.0.0.0')) {
      return origin;
    }
  }

  // Configured default production deployment domain
  return (envUrl || 'https://bloodchain-95960.web.app').replace(/\/+$/, '');
};

/**
 * Returns the public HTTPS verification URL encoded inside the QR code.
 * Scannable from any phone, camera, or remote device without localhost or local Wi-Fi requirement.
 */
export const getVerificationQrUrl = (token) => {
  if (!token) return getPublicAppBaseUrl();
  const baseUrl = getPublicAppBaseUrl();
  return `${baseUrl}/verify/${token}`;
};

/**
 * Returns the relative or local verification URL for instant in-browser testing on the current machine.
 */
export const getLocalVerificationUrl = (token) => {
  if (!token) return '/verify';
  return `/verify/${token}`;
};
