"use client";
export default function WhyMissingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40" role="dialog" aria-modal="true">
      <div className="absolute inset-x-0 top-16 mx-auto w-[min(92%,32rem)] glass-popover p-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Why isn’t this fully summarized?</h2>
        <ul className="mt-2 list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <li>Some measures don’t have structured text available yet from official APIs.</li>
          <li>We prioritize official and nonpartisan sources. We’re adding full cards continuously.</li>
          <li>You can still read a quick in‑app overview and open trusted sources below.</li>
        </ul>
        <div className="mt-3 text-sm">
          See our <a href="/about#trust" className="text-accent hover:underline">Trust & Methods</a> or email <a href="mailto:pranil.raichura@gmail.com" className="text-accent hover:underline">pranil.raichura@gmail.com</a> to request coverage.
        </div>
        <div className="mt-4 flex justify-end">
          <button className="liquid-button px-4 py-2 text-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}


