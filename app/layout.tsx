import type { Metadata } from "next";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";

import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Precifica+",
  description:
    "SaaS inteligente de precificação artesanal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body
        className="
          min-h-screen
          bg-gray-100
          text-slate-900
          antialiased
        "
      >
        <div className="flex min-h-screen">
          <Sidebar />

          <main
            className="
              flex-1
              overflow-x-hidden
            "
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}