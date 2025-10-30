"use client";
export default function WhyMissingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40" role="dialog" aria-modal="true">
      <div className="absolute inset-x-0 top-16 mx-auto w-[min(92%,32rem)] glass-popover p-5">
        <h2 className="text-lg font-semibold text-gray-100 dark:text-gray-900">Why isn’t this full?</h2>
        <p className="mt-2 text-sm text-gray-300 dark:text-gray-700">Some measures don’t have structured text yet. We prioritize official and nonpartisan sources and add full cards continuously.</p>
        <div className="mt-4 flex justify-end">
          <button className="liquid-button px-4 py-2 text-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
