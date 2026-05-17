"use client";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  useState,
} from "react";

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "📊",
  },
  {
    label: "Produtos",
    href: "/produtos",
    icon: "📦",
  },
  {
    label: "Materiais",
    href: "/materiais",
    icon: "🧵",
  },
  {
    label: "Empresa",
    href: "/empresa",
    icon: "🏢",
  },
];

export function Sidebar() {
  const pathname =
    usePathname();

  const [open, setOpen] =
    useState(false);

  return (
    <>
      {/* MOBILE TOPBAR */}
      <div
        className="
          fixed
          top-0
          left-0
          right-0
          z-40
          flex
          items-center
          justify-between
          border-b
          border-slate-800
          bg-slate-950
          px-4
          py-4

          md:hidden
        "
      >
        <button
          onClick={() =>
            setOpen(true)
          }
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            bg-slate-800
            text-white
          "
        >
          ☰
        </button>

        <h1 className="text-lg font-bold text-white">
          Precifica+
        </h1>

        <div className="w-11" />
      </div>

      {/* OVERLAY */}
      {open && (
        <div
          onClick={() =>
            setOpen(false)
          }
          className="
            fixed
            inset-0
            z-40
            bg-black/60
            backdrop-blur-sm

            md:hidden
          "
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed
          top-0
          left-0
          z-50
          flex
          h-screen
          w-[280px]
          flex-col
          justify-between
          bg-slate-950
          px-6
          py-8
          text-white
          transition-transform
          duration-300

          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }

          md:translate-x-0
        `}
      >
        <div>
          {/* HEADER */}
          <div className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tight">
                  Precifica+
                </h1>

                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  Plataforma
                  inteligente de
                  precificação
                  artesanal
                </p>
              </div>

              {/* CLOSE MOBILE */}
              <button
                onClick={() =>
                  setOpen(false)
                }
                className="
                  rounded-xl
                  bg-slate-800
                  p-2

                  md:hidden
                "
              >
                ✕
              </button>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="flex flex-col gap-3">
            {menuItems.map(
              (item) => {
                const active =
                  pathname ===
                  item.href;

                return (
                  <Link
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
                    onClick={() =>
                      setOpen(
                        false
                      )
                    }
                    className={`
                      flex
                      items-center
                      gap-4
                      rounded-2xl
                      px-5
                      py-4
                      text-lg
                      transition-all

                      ${
                        active
                          ? "bg-slate-800 font-bold text-white shadow-lg"
                          : "text-slate-300 hover:bg-slate-900 hover:text-white"
                      }
                    `}
                  >
                    <span className="text-2xl">
                      {
                        item.icon
                      }
                    </span>

                    {item.label}
                  </Link>
                );
              }
            )}
          </nav>
        </div>

        {/* FOOTER */}
        <div className="border-t border-slate-800 pt-6">
          <p className="text-sm text-slate-500">
            SaaS Artesanal ©
            2025
          </p>
        </div>
      </aside>

      {/* DESKTOP SPACING */}
      <div className="hidden w-[280px] md:block" />
    </>
  );
}