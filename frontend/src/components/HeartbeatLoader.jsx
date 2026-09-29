import React from 'react';

/**
 * HeartbeatLoader - Medical-grade cardiac heartbeat loading animation
 * Designed specifically for BloodChain with authentic "lub-dub" cardiac rhythm,
 * glowing vascular shockwave ripples, and an electrocardiogram lifeline.
 */
export const HeartbeatLoader = ({
  text = 'Loading BloodChain Portal...',
  subtext,
  size = 'md',
  className = ''
}) => {
  const sizeMap = {
    sm: {
      box: 'w-12 h-12',
      svg: 'w-10 h-10',
      ripple: 'w-12 h-12',
      text: 'text-xs',
      ecgW: 80,
    },
    md: {
      box: 'w-20 h-20',
      svg: 'w-16 h-16',
      ripple: 'w-20 h-20',
      text: 'text-xs sm:text-sm',
      ecgW: 120,
    },
    lg: {
      box: 'w-28 h-28',
      svg: 'w-24 h-24',
      ripple: 'w-28 h-28',
      text: 'text-sm sm:text-base',
      ecgW: 160,
    }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 select-none ${className}`}>
      
      {/* Cardiac Pulse Container with Concentric Ripple Waves */}
      <div className={`relative ${currentSize.box} flex items-center justify-center`}>
        
        {/* Outer Expanding Vascular Ripple */}
        <div 
          className={`absolute ${currentSize.ripple} rounded-full bg-rose-500/25 animate-heartbeat-ripple pointer-events-none`}
          style={{ animationDelay: '0s' }}
        />
        
        {/* Secondary Harmonic Ripple */}
        <div 
          className={`absolute ${currentSize.ripple} rounded-full bg-red-600/20 animate-heartbeat-ripple pointer-events-none`}
          style={{ animationDelay: '0.22s' }}
        />

        {/* Soft Radial Ambient Glow */}
        <div 
          className="absolute inset-0 rounded-full bg-rose-500/30 blur-xl animate-heartbeat-glow pointer-events-none" 
        />

        {/* The Heart Symbol with Dual-Pulse Cardiac Rhythm */}
        <div className={`relative z-10 ${currentSize.svg} flex items-center justify-center animate-heartbeat`}>
          <svg
            viewBox="0 0 100 92"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-md"
          >
            <defs>
              {/* Rich Ruby-to-Crimson Gradient */}
              <linearGradient id="heartGradient" x1="15%" y1="10%" x2="85%" y2="90%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="50%" stopColor="#e11d48" />
                <stop offset="100%" stopColor="#be123c" />
              </linearGradient>

              {/* Subtle Gloss Highlight */}
              <linearGradient id="heartGloss" x1="30%" y1="0%" x2="70%" y2="60%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              {/* Ambient Drop Glow */}
              <filter id="cardiacGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#be123c" floodOpacity="0.45" />
              </filter>
            </defs>

            {/* Anatomical Heart Body */}
            <path
              d="M50,84 C50,84 10,54 10,27 C10,13 22,5 34,5 C43,5 47.5,10.5 50,15 C52.5,10.5 57,5 66,5 C78,5 90,13 90,27 C90,54 50,84 50,84 Z"
              fill="url(#heartGradient)"
              filter="url(#cardiacGlow)"
            />

            {/* Upper Chamber Gloss Highlight */}
            <path
              d="M24,10 C15,16 13,28 17,40 C19,30 25,18 34,11 C37,9 34,7 24,10 Z"
              fill="url(#heartGloss)"
            />

            {/* Electrocardiogram (ECG) Lifeline Wave Running Across the Heart */}
            <path
              d="M14,44 L32,44 L37,30 L43,62 L49,24 L55,56 L60,40 L65,44 L86,44"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-sm"
            />
          </svg>
        </div>
      </div>

      {/* Sub-Cardio ECG Lifeline Monitor Track */}
      <div className="flex items-center gap-1.5 opacity-80 pt-1">
        <svg 
          width={currentSize.ecgW} 
          height="16" 
          viewBox="0 0 120 16" 
          fill="none" 
          className="text-rose-600/70"
        >
          {/* Faint Background Track Line */}
          <line x1="0" y1="8" x2="120" y2="8" stroke="rgba(190, 18, 60, 0.2)" strokeWidth="1.5" />
          
          {/* Animated Traveling ECG Pulse */}
          <path
            d="M0,8 L35,8 L40,8 L44,2 L48,14 L52,1 L56,15 L60,6 L64,8 L120,8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-ecg-line"
          />
        </svg>
      </div>

      {/* Status Text & Cadence */}
      <div className="text-center space-y-1">
        <p className={`${currentSize.text} font-mono font-medium text-stone-700 tracking-wide flex items-center justify-center gap-1.5`}>
          <span>{text}</span>
        </p>
        
        {subtext ? (
          <p className="text-[11px] text-stone-500 font-mono tracking-tight">{subtext}</p>
        ) : (
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-stone-500 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Vital Node Active • 72 BPM</span>
          </div>
        )}
      </div>

    </div>
  );
};

export default HeartbeatLoader;
