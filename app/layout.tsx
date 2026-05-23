"use client";

import type { Metadata } from "next";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import {
  usePathname,
} from "next/navigation";

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

const hiddenSidebarRoutes = [
  "/login",
  "/auth/callback",
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname =
    usePathname();

  const hideSidebar =
    hiddenSidebarRoutes.some(
      (route) =>
        pathname.startsWith(route)
    );

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body
        className="
          bg-gray-100
          text-slate-900
        "
      >
<div className="flex min-h-screen">
  {!hideSidebar && (
    <Sidebar />
  )}

  <main
    className="
      flex-1
      pt-[72px]

      md:pl-[220px]
      md:pt-0
    "
  >
    {children}
  </main>
</div>
      </body>
    </html>
  );
}