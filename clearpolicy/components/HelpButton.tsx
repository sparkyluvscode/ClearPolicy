"use client";
import { useEffect, useState } from "react";

export default function HelpButton() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <>
      <button
        type="button"
        className="fixed bottom-4 right-4 liquid-button px-4 py-2 text-sm z-40"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        Need help?
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40" role="dialog" aria-modal="true">
          <div className="absolute inset-x-0 bottom-20 mx-auto w-[min(92%,28rem)] glass-popover p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick tips</h2>
            <ul className="mt-2 list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
              <li>Search a law or “prop 17 retail theft”. Try H.R. 50 for federal.</li>
              <li>Open a card, switch the reading level, and expand cited lines.</li>
              <li>Use Local lens to see your state senator and assemblymember.</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <button className="liquid-button px-4 py-2 text-sm" onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


