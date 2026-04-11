export function CopilotLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#E8E8E8" />
          <stop offset="100%" stopColor="#D0D0D0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Main circle background */}
      <circle cx="100" cy="100" r="90" fill="url(#logoGrad)" opacity="0.95"/>
      
      {/* Navigation compass points */}
      <g filter="url(#glow)">
        {/* North point */}
        <path d="M100 30 L110 60 L100 55 L90 60 Z" fill="white" opacity="0.9"/>
        
        {/* East point */}
        <path d="M170 100 L140 110 L145 100 L140 90 Z" fill="white" opacity="0.7"/>
        
        {/* South point */}
        <path d="M100 170 L110 140 L100 145 L90 140 Z" fill="white" opacity="0.7"/>
        
        {/* West point */}
        <path d="M30 100 L60 110 L55 100 L60 90 Z" fill="white" opacity="0.7"/>
      </g>
      
      {/* Center AI/Neural network symbol */}
      <g>
        {/* Center node */}
        <circle cx="100" cy="100" r="12" fill="white" opacity="0.95"/>
        
        {/* Connecting lines */}
        <line x1="100" y1="88" x2="100" y2="50" stroke="white" strokeWidth="2.5" opacity="0.6"/>
        <line x1="112" y1="100" x2="145" y2="100" stroke="white" strokeWidth="2.5" opacity="0.4"/>
        <line x1="100" y1="112" x2="100" y2="145" stroke="white" strokeWidth="2.5" opacity="0.4"/>
        <line x1="88" y1="100" x2="55" y2="100" stroke="white" strokeWidth="2.5" opacity="0.4"/>
        
        {/* Small outer nodes */}
        <circle cx="100" cy="50" r="6" fill="white" opacity="0.8"/>
        <circle cx="145" cy="100" r="5" fill="white" opacity="0.6"/>
        <circle cx="100" cy="145" r="5" fill="white" opacity="0.6"/>
        <circle cx="55" cy="100" r="5" fill="white" opacity="0.6"/>
      </g>
      
      {/* Orbital rings suggesting movement/navigation */}
      <circle cx="100" cy="100" r="75" stroke="white" strokeWidth="1.5" fill="none" opacity="0.15"/>
      <circle cx="100" cy="100" r="60" stroke="white" strokeWidth="1" fill="none" opacity="0.1"/>
    </svg>
  )
}

export function CopilotLogoSmall({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGradSmall" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="50%" stopColor="#7B70FF" />
          <stop offset="100%" stopColor="#5B4FE0" />
        </linearGradient>
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      
      {/* Main circle with purple gradient */}
      <circle cx="50" cy="50" r="48" fill="url(#logoGradSmall)"/>
      
      {/* DeFi-themed geometric pattern */}
      {/* Top triangle - represents growth/uptrend */}
      <path d="M50 20 L65 45 L35 45 Z" fill="white" opacity="0.2"/>
      <path d="M50 25 L60 42 L40 42 Z" fill="url(#accentGrad)" opacity="0.8"/>
      
      {/* Center hexagon - blockchain/network */}
      <path d="M50 35 L60 40 L60 50 L50 55 L40 50 L40 40 Z" fill="white" opacity="0.95"/>
      
      {/* Inner nodes - connection points */}
      <circle cx="50" cy="42" r="3" fill="url(#logoGradSmall)"/>
      <circle cx="56" cy="45" r="2.5" fill="url(#accentGrad)" opacity="0.8"/>
      <circle cx="44" cy="45" r="2.5" fill="url(#accentGrad)" opacity="0.8"/>
      
      {/* Bottom arc - represents liquidity/flow */}
      <path d="M35 60 Q50 70 65 60" stroke="white" strokeWidth="3" fill="none" opacity="0.3"/>
      <path d="M38 62 Q50 68 62 62" stroke="url(#accentGrad)" strokeWidth="2" fill="none" opacity="0.9"/>
      
      {/* Orbital ring */}
      <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="1.5" fill="none" opacity="0.15"/>
    </svg>
  )
}
