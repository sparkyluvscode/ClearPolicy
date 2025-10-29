"use client";
import { useEffect, useState } from "react";

export default function TourOverlay() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem("cp_tour_seen");
    if (!seen) setShow(true);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:backdrop-blur-lg">
      <div className="absolute inset-x-0 top-10 mx-auto w-[min(90%,28rem)] glass-modal p-5">
        <h2 className="text-lg font-semibold text-gray-900">Welcome to ClearPolicy</h2>
        <p className="mt-2 text-sm text-gray-700">
          Search a bill or proposition, adjust the reading level, and expand cited lines to verify information. Try the Local lens with your ZIP.
        </p>
        <div className="mt-4 flex justify-end">
          <button className="liquid-button px-4 py-2 text-sm" onClick={() => { localStorage.setItem("cp_tour_seen", "1"); setShow(false); }}>Got it</button>
        </div>
      </div>
    </div>
  );
}


