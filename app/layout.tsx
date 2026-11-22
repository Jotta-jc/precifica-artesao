import type { Metadata, Viewport } from "next";

import { Nunito_Sans } from "next/font/google";

import "./globals.css";

import { AppShell } from "@/components/layout/AppShell";
import { FRASE_SISTEMA, NOME_SISTEMA } from "@/lib/marca";

/* Fonte variável (sem fixar pesos): permite 400, 500, 600 e 700. */
const fontePrincipal = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-principal",
});

export const metadata: Metadata = {
  title: NOME_SISTEMA,
  description: `${FRASE_SISTEMA}: organize, precifique e venda o seu trabalho artesanal.`,
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
      className={fontePrincipal.variable}
    >
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
