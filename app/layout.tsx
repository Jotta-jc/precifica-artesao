import type { Metadata, Viewport } from "next";

import { Atkinson_Hyperlegible } from "next/font/google";

import "./globals.css";

import { AppShell } from "@/components/layout/AppShell";
import { NOME_SISTEMA } from "@/lib/marca";

const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-atkinson",
});

export const metadata: Metadata = {
  title: NOME_SISTEMA,
  description:
    "Organize e precifique o seu trabalho artesanal",
};

/* viewportFit "cover": a página ocupa a tela toda no iPhone, e
   env(safe-area-inset-bottom) passa a valer (espaço da faixa de gestos). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
