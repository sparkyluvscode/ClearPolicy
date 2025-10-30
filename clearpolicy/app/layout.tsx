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
    <html lang="en" className="h-full">
      <body className="min-h-dvh dark:bg-gray-50 dark:text-gray-900">
        <Script id="cp-theme-init" strategy="beforeInteractive">
          {`(function(){try{var s=localStorage.getItem('cp_theme');var prefers=window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=s?s==='dark':prefers;var el=document.documentElement; if(dark){el.classList.add('dark');}else{el.classList.remove('dark');}}catch(e){}})();`}
        </Script>
        <Header />
        {missingKeys && (
          <div className="bg-amber-900/20 border-b border-amber-800 text-amber-200 dark:bg-amber-50 dark:text-amber-900 dark:border-amber-200">
            <div className="mx-auto max-w-6xl px-4 py-2 text-sm">
              Live data temporarily unavailable—showing verified sample content.
            </div>
          </div>
        )}
        <main className="mx-auto max-w-6xl px-4 py-6">
          {children}
        </main>
        <HelpButton />
        <Footer />
      </body>
    </html>
  );
}


