import "./globals.css";
import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Libre_Baskerville } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

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
    <ClerkProvider>
      <html lang="en" className={`h-full ${inter.variable} ${libreBaskerville.variable}`} suppressHydrationWarning>
        <body className="min-h-dvh font-sans">
          <Script id="cp-theme-init" strategy="beforeInteractive">
            {`(function(){try{var s=localStorage.getItem('cp_theme');var el=document.documentElement;if(s){var dark=s==='dark';if(dark){el.classList.add('dark');}else{el.classList.remove('dark');}}else{var prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;if(prefersDark){el.classList.add('dark');}else{el.classList.remove('dark');}}}catch(e){}})();`}
          </Script>
          <div className="relative z-10">
            <Header />
            {missingKeys && (
              <div className="cp-site-warning border-b border-[var(--cp-border)] bg-[var(--cp-surface-2)]">
                <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-12 py-2 text-xs tracking-wide text-[var(--cp-muted)]">
                  Live data temporarily unavailable — showing verified sample content.
                </div>
              </div>
            )}
            <main className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-12 pb-20 pt-6">
              {children}
            </main>
            <Footer />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
