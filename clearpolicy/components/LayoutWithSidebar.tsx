"use client";

import { ReactNode, useState, useEffect } from "react";
import { useAuthGate } from "@/components/AuthGateProvider";
import ResearchSidebar from "@/components/ResearchSidebar";

export default function LayoutWithSidebar({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuthGate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cp_sidebar_open");
      if (stored === "true") setSidebarOpen(true);
    }
  }, []);

  function toggleSidebar() {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem("cp_sidebar_open", String(next));
      return next;
    });
  }

  const showSidebar = hydrated && isSignedIn;

  return (
    <>
      {showSidebar && (
        <ResearchSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      )}
      <div
        className="transition-all duration-300 ease-out"
        style={{
          marginLeft: showSidebar && sidebarOpen ? "256px" : "0",
        }}
      >
        {children}
      </div>
    </>
  );
}
