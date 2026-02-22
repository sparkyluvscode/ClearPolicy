"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd/Ctrl + K: Focus search input
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input =
          document.querySelector<HTMLInputElement>("[data-search-input]") ||
          document.querySelector<HTMLInputElement>('input[aria-label="Ask a follow-up question"]') ||
          document.querySelector<HTMLInputElement>('input[type="text"]');
        if (input) {
          input.focus();
          input.select();
        }
      }

      // Escape: Navigate back from results/explore
      if (e.key === "Escape" && !e.metaKey && !e.ctrlKey) {
        const active = document.activeElement;
        if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
          active.blur();
          return;
        }
        if (pathname?.startsWith("/search") || pathname?.startsWith("/explore")) {
          router.push("/");
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, pathname]);

  return null;
}
