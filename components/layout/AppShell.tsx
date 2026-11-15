"use client";

import { usePathname } from "next/navigation";

import { Sidebar } from "@/components/Sidebar";
import { AvisosProvider } from "@/components/ui/Avisos";

const hiddenSidebarRoutes = [
  "/login",
  "/auth/callback",
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
    </AvisosProvider>
  );
}
