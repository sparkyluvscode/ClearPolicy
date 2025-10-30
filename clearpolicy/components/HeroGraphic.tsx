export default function HeroGraphic() {
  return (
    <div aria-hidden="true" className="pointer-events-none select-none">
      <svg viewBox="0 0 960 360" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#4f46e5" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0b1220" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="cardSheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#e5e7eb" stopOpacity="0.75" />
          </linearGradient>
          <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>

        {/* Rounded ambient container to match site cards */}
        <rect x="20" y="20" width="920" height="320" rx="32" ry="32" fill="url(#bgGrad)" />
        <rect x="20" y="20" width="920" height="320" rx="32" ry="32" fill="none" stroke="#ffffff" strokeOpacity="0.18" />

        {/* Subtle CA star (muted, not political) */}
        <g opacity="0.12" transform="translate(840,60)">
          <polygon points="0,-18 5,-2 22,-2 8,7 12,24 0,13 -12,24 -8,7 -22,-2 -5,-2" fill="#ef4444" />
        </g>

        {/* Simplified ballot card */}
        <g transform="translate(120,70)">
          <rect rx="26" ry="26" width="640" height="220" fill="url(#cardSheen)" />
          {/* lines */}
          <rect x="40" y="54" width="320" height="14" rx="7" fill="#cbd5e1" />
          <rect x="40" y="92" width="460" height="14" rx="7" fill="#cbd5e1" />
          <rect x="40" y="130" width="400" height="14" rx="7" fill="#cbd5e1" />
          {/* progress bar */}
          <rect x="40" y="172" width="180" height="10" rx="5" fill="#4f46e5" />
        </g>

        {/* Magnifying glass over card */}
        <g transform="translate(560,84)">
          <circle cx="0" cy="0" r="34" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
          <rect x="24" y="20" width="52" height="10" rx="5" fill="#94a3b8" transform="rotate(35 24 20)" />
          <circle cx="0" cy="0" r="26" fill="#ffffff" opacity="0.65" />
        </g>

        {/* Checkmark for clarity */}
        <g transform="translate(220,152)" filter="url(#softBlur)" opacity="0.25">
          <path d="M0 20 L18 36 L52 0" stroke="#22c55e" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g transform="translate(220,152)">
          <path d="M0 20 L18 36 L52 0" stroke="#22c55e" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Subtle state silhouette (abstract, muted) */}
        <g opacity="0.10" transform="translate(740,220) scale(1.05)">
          <path d="M-40,-80 C-52,-68 -44,-52 -58,-44 C-70,-36 -66,-18 -76,-8 C-88,2 -84,14 -78,22 C-70,34 -82,54 -56,68 C-40,76 -30,94 -6,92 C10,90 18,80 20,68 C22,58 36,46 30,34 C22,18 40,-6 26,-18 C12,-30 6,-46 -10,-56 C-22,-64 -28,-76 -40,-80 Z" fill="#64748b" />
        </g>
      </svg>
    </div>
  );
}
