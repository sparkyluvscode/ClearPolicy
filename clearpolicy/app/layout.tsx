import "./globals.css";
import { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
      <body className="min-h-dvh dark:bg-gray-950 dark:text-gray-100">
        <Header />
        {missingKeys && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-900/40">
            <div className="mx-auto max-w-6xl px-4 py-2 text-sm">
              Live data temporarily unavailable—showing verified sample content.
            </div>
          </div>
        )}
        <main className="mx-auto max-w-6xl px-4 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}


