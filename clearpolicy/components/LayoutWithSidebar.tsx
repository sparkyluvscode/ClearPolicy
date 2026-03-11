"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useAuthGate } from "@/components/AuthGateProvider";
import ResearchSidebar from "@/components/ResearchSidebar";

export const SIDEBAR_WIDTH = 256;

type SidebarContextValue = { sidebarOpen: boolean; sidebarWidth: number };
const SidebarContext = createContext<SidebarContextValue>({ sidebarOpen: false, sidebarWidth: SIDEBAR_WIDTH });
export const useSidebarContext = () => useContext(SidebarContext);

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
  const contentShift = showSidebar && sidebarOpen ? SIDEBAR_WIDTH : 0;

  return (
    <SidebarContext.Provider value={{ sidebarOpen: !!contentShift, sidebarWidth: SIDEBAR_WIDTH }}>
      {showSidebar && (
        <ResearchSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      )}
      <div
        className="transition-all duration-300 ease-out"
        style={{
          marginLeft: contentShift,
        }}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}
