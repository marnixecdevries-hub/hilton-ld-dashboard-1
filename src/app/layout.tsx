import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hilton L&D Dashboard",
  description: "Train the Trainer - Evaluation Tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Sidebar />
        <main className="lg:ml-64 min-h-screen">
          <div className="px-4 sm:px-6 lg:px-8 py-8 pt-16 lg:pt-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
