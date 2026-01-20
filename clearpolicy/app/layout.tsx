import "./globals.css";
import { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HelpButton from "@/components/HelpButton";
import Script from "next/script";

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "ClearPolicy",
  description: "Non-partisan civic education: understand policy quickly with sources.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const missingKeys = [
    process.env.CONGRESS_API_KEY === "your_api_data_gov_key" || !process.env.CONGRESS_API_KEY,
    process.env.OPENSTATES_API_KEY === "your_openstates_key" || !process.env.OPENSTATES_API_KEY,
    process.env.GOOGLE_CIVIC_API_KEY === "your_google_civic_key" || !process.env.GOOGLE_CIVIC_API_KEY,
  ].some(Boolean);

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-dvh">
            <Script id="cp-theme-init" strategy="beforeInteractive">
              {`(function(){try{var s=localStorage.getItem('cp_theme');var el=document.documentElement;if(s){var dark=s==='dark';if(dark){el.classList.add('dark');}else{el.classList.remove('dark');}}else{var prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;if(prefersDark){el.classList.add('dark');}else{el.classList.remove('dark');}}}catch(e){}})();`}
            </Script>
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <video
            className="h-full w-full object-cover opacity-5 brightness-75 saturate-90"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
          >
            <source src="/clearpolicy-animation.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="relative z-10">
          <Header />
          {missingKeys && (
            <div className="border-b border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
              <div className="mx-auto max-w-6xl px-4 py-2 text-sm">
                Live data temporarily unavailable—showing verified sample content.
              </div>
            </div>
          )}
          <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8">
            {children}
          </main>
          <HelpButton />
          <Footer />
        </div>
      </body>
    </html>
  );
}


