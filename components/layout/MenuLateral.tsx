"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Icone, type NomeIcone } from "@/components/ui/Icone";
import { NOME_SISTEMA } from "@/lib/marca";
import { createClient } from "@/lib/supabase/client";

interface ItemMenu {
  rotulo: string;
  href: string;
  icone: NomeIcone;
  /** Páginas dentro do href que NÃO deixam o item ativo (têm item próprio). */
  exceto?: string[];
}

interface GrupoMenu {
  titulo?: string;
  itens: ItemMenu[];
}

const grupos: GrupoMenu[] = [
  {
    itens: [
      { rotulo: "Início", href: "/dashboard", icone: "inicio" },
    ],
  },
  {
    titulo: "Materiais",
    itens: [
      { rotulo: "Materiais", href: "/materiais", icone: "materiais" },
      { rotulo: "Estoque", href: "/estoque", icone: "compra" },
    ],
  },
  {
    titulo: "Produtos",
    itens: [
      { rotulo: "Produtos", href: "/produtos", icone: "produtos" },
      { rotulo: "Cálculo rápido", href: "/calculadora-rapida", icone: "calculadora" },
    ],
  },
  {
    titulo: "Vendas",
    itens: [
      { rotulo: "Pedidos", href: "/pedidos", icone: "vendas" },
      { rotulo: "Clientes", href: "/clientes", icone: "conversa" },
      { rotulo: "Vitrine", href: "/empresa/vitrine", icone: "vitrine" },
    ],
  },
  {
    itens: [
      {
        rotulo: "Dados do ateliê",
        href: "/empresa",
        icone: "atelie",
        exceto: ["/empresa/vitrine"],
      },
    ],
  },
];

/** O próprio endereço ou uma página dentro dele. */
function dentroDe(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Ativo dentro do href, menos nas páginas de `exceto` (que têm item próprio). */
function estaAtivo(pathname: string, href: string, exceto: string[] = []) {
  return dentroDe(pathname, href) && !exceto.some((e) => dentroDe(pathname, e));
}

export function MenuLateral() {
  const pathname = usePathname();
  const router = useRouter();
  const [nomeAtelie, setNomeAtelie] = useState("");

  /* Mesma busca do Sidebar antigo: nome_empresa em business_metrics. */
  useEffect(() => {
    const supabase = createClient();

    async function carregarAtelie() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("business_metrics")
        .select("nome_empresa")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data?.nome_empresa) {
        setNomeAtelie(data.nome_empresa);
      }
    }

    carregarAtelie();
  }, []);

  /* Mesma saída do Sidebar antigo. */
  async function sair() {
    await createClient().auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      className="
        fixed
        inset-y-0
        left-0
        z-40
        hidden
        w-64
        flex-col
        overflow-y-auto
        border-r
        border-borda
        bg-cartao
        px-4
        py-6
        md:flex
      "
    >
      <div className="mb-6 px-3">
        <p className="text-2xl font-bold text-destaque">
          {NOME_SISTEMA}
        </p>

        {nomeAtelie && (
          <p className="mt-1 text-base text-texto-suave">
            {nomeAtelie}
          </p>
        )}
      </div>

      <nav
        aria-label="Menu principal"
        className="flex flex-1 flex-col gap-5"
      >
        {grupos.map((grupo, indice) => {
          const idTitulo = grupo.titulo
            ? `menu-grupo-${indice}`
            : undefined;

          return (
            <div key={grupo.titulo ?? indice}>
              {grupo.titulo && (
                <p
                  id={idTitulo}
                  className="mb-2 px-3 text-sm font-bold uppercase tracking-wide text-texto-suave"
                >
                  {grupo.titulo}
                </p>
              )}

              <ul
                aria-labelledby={idTitulo}
                className="flex flex-col gap-1"
              >
                {grupo.itens.map((item) => {
                  const ativo = estaAtivo(pathname, item.href, item.exceto);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={ativo ? "page" : undefined}
                        className={`
                          flex
                          min-h-12
                          items-center
                          gap-3
                          rounded-2xl
                          px-3
                          py-2
                          text-lg
                          transition-colors
                          focus-visible:outline-none
                          focus-visible:ring-[3px]
                          focus-visible:ring-destaque
                          ${
                            ativo
                              ? "bg-destaque-suave font-bold text-destaque-escuro"
                              : "text-texto hover:bg-fundo"
                          }
                        `}
                      >
                        <Icone nome={item.icone} />
                        <span>{item.rotulo}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-borda pt-4">
        <button
          type="button"
          onClick={sair}
          className="
            flex
            min-h-12
            w-full
            items-center
            gap-3
            rounded-2xl
            px-3
            py-2
            text-lg
            text-texto
            transition-colors
            hover:bg-fundo
            focus-visible:outline-none
            focus-visible:ring-[3px]
            focus-visible:ring-destaque
          "
        >
          <Icone nome="sair" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
