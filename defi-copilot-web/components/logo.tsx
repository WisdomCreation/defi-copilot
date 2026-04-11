export function CopilotLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Black square background */}
      <rect width="200" height="200" rx="40" fill="#111111"/>
      {/* Top row: small circle + large circle */}
      <circle cx="82" cy="42" r="14" fill="white"/>
      <circle cx="145" cy="52" r="28" fill="white"/>
      {/* Middle row: pill (left-open) + long pill */}
      <rect x="38" y="72" width="68" height="26" rx="13" fill="white"/>
      <rect x="82" y="100" width="82" height="26" rx="13" fill="white"/>
      {/* Bottom row: 4 circles */}
      <circle cx="38" cy="143" r="16" fill="white"/>
      <circle cx="82" cy="155" r="16" fill="white"/>
      <circle cx="127" cy="155" r="14" fill="white"/>
      <circle cx="82" cy="185" r="12" fill="white" opacity="0.5"/>
      <circle cx="38" cy="185" r="14" fill="white" opacity="0.7"/>
    </svg>
  )
}

export function CopilotLogoSmall({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" rx="40" fill="#111111"/>
      <circle cx="82" cy="42" r="14" fill="white"/>
      <circle cx="145" cy="52" r="28" fill="white"/>
      <rect x="38" y="72" width="68" height="26" rx="13" fill="white"/>
      <rect x="82" y="100" width="82" height="26" rx="13" fill="white"/>
      <circle cx="38" cy="143" r="16" fill="white"/>
      <circle cx="82" cy="155" r="16" fill="white"/>
      <circle cx="127" cy="155" r="14" fill="white"/>
      <circle cx="82" cy="185" r="12" fill="white" opacity="0.5"/>
      <circle cx="38" cy="185" r="14" fill="white" opacity="0.7"/>
    </svg>
  )
}
