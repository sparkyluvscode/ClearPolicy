export default function Illustration({ label = "App demo" }: { label?: string }) {
  return (
    <figure className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-surface)] p-6" aria-label={label} role="img">
      <svg viewBox="0 0 600 280" className="w-full h-auto" aria-hidden>
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(79,70,229,0.25)" />
            <stop offset="100%" stopColor="rgba(14,165,233,0.25)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="600" height="280" rx="24" fill="url(#g1)"/>
        <rect x="30" y="30" width="380" height="40" rx="12" fill="#fff" fillOpacity="0.7" />
        <rect x="30" y="80" width="540" height="160" rx="16" fill="#fff" fillOpacity="0.7" />
        <rect x="46" y="100" width="220" height="12" rx="6" fill="#0b1220" fillOpacity="0.2" />
        <rect x="46" y="122" width="280" height="12" rx="6" fill="#0b1220" fillOpacity="0.18" />
        <rect x="46" y="144" width="260" height="12" rx="6" fill="#0b1220" fillOpacity="0.16" />
        <rect x="46" y="180" width="100" height="10" rx="5" fill="#4f46e5" fillOpacity="0.8" />
      </svg>
    </figure>
  );
}


