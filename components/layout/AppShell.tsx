"use client";

import { usePathname } from "next/navigation";

import { MenuInferior } from "@/components/layout/MenuInferior";
import { MenuLateral } from "@/components/layout/MenuLateral";
import { AvisosProvider } from "@/components/ui/Avisos";

const hiddenSidebarRoutes = [
  "/login",
  "/auth/callback",
  "/v/",
];

export function AppShell({
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
    <AvisosProvider>
      <div className="flex min-h-screen">
        {!hideSidebar && (
          <>
            <MenuLateral />
            <MenuInferior />
          </>
        )}

        {/* Com menu: no computador, espaço da lateral (256px); no celular,
            espaço embaixo para a barra (96px + área segura). */}
        <main
          className={`
            min-w-0
            flex-1
            ${
              hideSidebar
                ? ""
                : "pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-0 md:pl-64"
            }
          `}
        >
          {children}
        </main>
      </div>
    </AvisosProvider>
  );
}
