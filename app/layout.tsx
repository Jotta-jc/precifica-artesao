import type { Metadata } from "next";

import { Atkinson_Hyperlegible } from "next/font/google";

import "./globals.css";

import { AppShell } from "@/components/layout/AppShell";

const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-atkinson",
});

export const metadata: Metadata = {
  title: "Precifica+",
  description:
    "Organize e precifique o seu trabalho artesanal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={atkinson.variable}
    >
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
