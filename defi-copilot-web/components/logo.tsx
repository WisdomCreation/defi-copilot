export function CopilotLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Solid purple circle background */}
      <circle cx="100" cy="100" r="90" fill="#7C3AED"/>

      {/* Upward trending line — DeFi chart motif */}
      <polyline
        points="40,140 75,100 105,115 160,60"
        stroke="white"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.95"
      />

      {/* Arrow head at top right of line */}
      <polyline
        points="145,55 160,60 155,75"
        stroke="white"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.95"
      />

      {/* Subtle orbit ring */}
      <circle cx="100" cy="100" r="78" stroke="white" strokeWidth="2" fill="none" opacity="0.12"/>
    </svg>
  )
}

export function CopilotLogoSmall({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Solid purple circle — no gradient IDs needed */}
      <circle cx="50" cy="50" r="48" fill="#7C3AED"/>

      {/* Upward trending chart line */}
      <polyline
        points="20,70 37,50 53,57 80,30"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.95"
      />

      {/* Arrow head */}
      <polyline
        points="72,27 80,30 77,38"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.95"
      />
    </svg>
  )
}
