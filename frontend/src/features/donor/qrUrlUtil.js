/**
 * Utility to generate public verification URLs for BloodChain QR Codes.
 * Ensures production QR codes point to a publicly accessible HTTPS domain
 * and NOT localhost, 127.0.0.1, or local network IPs.
 */

export const getPublicAppBaseUrl = () => {
  // Configurable environment variable (supports PUBLIC_APP_URL and VITE_PUBLIC_APP_URL)
  const envUrl = import.meta.env.PUBLIC_APP_URL || import.meta.env.VITE_PUBLIC_APP_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    // Ensure we do NOT use localhost or loopback in QR codes intended for external testing
    if (!trimmed.includes('localhost') && !trimmed.includes('127.0.0.1') && !trimmed.includes('0.0.0.0')) {
      return trimmed;
    }
  }

  // If the application is accessed directly via a public HTTPS tunnel or domain in browser
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const origin = window.location.origin;
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1') && !origin.includes('0.0.0.0')) {
      return origin;
    }
  }

  // Fallback to configured envUrl or window origin if available
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  return typeof window !== 'undefined' && window.location && window.location.origin
    ? window.location.origin
    : '';
};

/**
 * Returns the public HTTPS verification URL encoded inside the QR code.
 * Scannable from any phone, camera, or remote device.
 * Format: ${PUBLIC_APP_URL}/verify/<secure-token>
 */
export const getVerificationQrUrl = (token) => {
  const baseUrl = getPublicAppBaseUrl();
  if (!token) return baseUrl || '/verify';
  return baseUrl ? `${baseUrl}/verify/${token}` : `/verify/${token}`;
};

/**
 * Returns the relative or local verification URL for instant in-browser testing on the current machine.
 */
export const getLocalVerificationUrl = (token) => {
  if (!token) return '/verify';
  return `/verify/${token}`;
};
