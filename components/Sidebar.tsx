"use client";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

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
    label: "Clientes",
    href: "/clientes",
    icon: "👥",
  },
  {
    label: "Empresa",
    href: "/empresa",
    icon: "🏢",
  },
  {
  label: "Calculadora Rápida",
  href: "/calculadora-rapida",
  icon: "⚡",
},
  {
    label: "Calculadora",
    href: "/calculadora",
    icon: "🧮",
  },
  {
    label: "Configurações IA",
    href: "/configuracoes",
    icon: "⚙️",
  },
];

export function Sidebar() {
  const supabase = createClient();
  const pathname =
    usePathname();

  const router =
    useRouter();

  const [open, setOpen] =
    useState(false);

    const [nomeEmpresa, setNomeEmpresa] =
  useState("Precifica+");

  useEffect(() => {
  async function carregarEmpresa() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } =
      await supabase
        .from("business_metrics")
        .select("nome_empresa")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .single();

    if (data?.nome_empresa) {
      setNomeEmpresa(
        data.nome_empresa
      );
    }
  }

  carregarEmpresa();
}, []);

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/login");
  }

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
          py-3

          md:hidden
        "
      >
        <button
          onClick={() =>
            setOpen(true)
          }
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-lg
            bg-slate-800
            text-white
            text-lg
          "
        >
          ☰
        </button>

        <h1
          className="
            text-lg
            font-bold
            text-white
          "
        >
          Precifica+
        </h1>

        <div className="w-10" />
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
          w-[240px]
          flex-col
          justify-between
          bg-slate-950
          px-4
          py-5
          text-white
          transition-transform
          duration-300

          -translate-x-full

          ${
            open
              ? "translate-x-0"
              : ""
          }

          md:translate-x-0
        `}
      >
        <div>
          {/* HEADER */}
          <div className="mb-10">
            <div
              className="
                mb-4
                flex
                items-center
                justify-between
              "
            >
              <div>
                <h1
                  className="
                    text-4xl
                    font-black
                    tracking-tight
                  "
                >
                  Precifica+
                </h1>

<p className="mt-3 text-lg font-semibold text-slate-300">
  {nomeEmpresa}
</p>
              </div>

              {/* CLOSE MOBILE */}
              <button
                onClick={() =>
                  setOpen(false)
                }
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-lg
                  bg-slate-800
                  text-xl
                  text-white

                  md:hidden
                "
              >
                ✕
              </button>
            </div>
          </div>

          {/* MENU */}
          <nav
            className="
              flex
              flex-col
              gap-3
            "
          >
            {menuItems.map((item) => {
              const active =
                pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setOpen(false)
                  }
                  className={`
                    flex
                    items-center
                    gap-4
                    rounded-2xl
                    px-4
                    py-4
                    text-lg
                    font-semibold
                    transition-all
                    duration-200

                    ${
                      active
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }
                  `}
                >
                  <span className="text-2xl">
                    {item.icon}
                  </span>

                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* FOOTER */}
        <div
          className="
            border-t
            border-slate-800
            pt-6
          "
        >
          <button
            onClick={handleLogout}
            className="
              mb-5
              w-full
              rounded-2xl
              bg-slate-800
              px-4
              py-4
              text-base
              font-bold
              text-white
              transition-all

              hover:bg-red-600
            "
          >
            Sair
          </button>

          <p
            className="
              text-center
              text-xs
              text-slate-500
            "
          >
            SaaS Artesanal © 2025
          </p>
        </div>
      </aside>
    </>
  );
}