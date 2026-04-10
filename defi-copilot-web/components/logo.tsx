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
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D0D0D0" />
        </linearGradient>
      </defs>
      
      <circle cx="50" cy="50" r="48" fill="url(#logoGradSmall)"/>
      
      {/* Simplified compass */}
      <path d="M50 15 L55 40 L50 37 L45 40 Z" fill="white" opacity="0.9"/>
      <path d="M85 50 L60 55 L63 50 L60 45 Z" fill="white" opacity="0.6"/>
      <path d="M50 85 L55 60 L50 63 L45 60 Z" fill="white" opacity="0.6"/>
      <path d="M15 50 L40 55 L37 50 L40 45 Z" fill="white" opacity="0.6"/>
      
      <circle cx="50" cy="50" r="8" fill="white" opacity="0.95"/>
      <circle cx="50" cy="50" r="35" stroke="white" strokeWidth="1" fill="none" opacity="0.1"/>
    </svg>
  )
}
