"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";

import { Icone, type NomeIcone } from "@/components/ui/Icone";
import { createClient } from "@/lib/supabase/client";

interface ItemBarra {
  rotulo: string;
  href: string;
  icone: NomeIcone;
  /** Outros endereços que também deixam o item ativo. */
  tambem?: string[];
}

const itensBarra: ItemBarra[] = [
  { rotulo: "Início", href: "/dashboard", icone: "inicio" },
  { rotulo: "Materiais", href: "/materiais", icone: "materiais", tambem: ["/estoque"] },
  {
    rotulo: "Produtos",
    href: "/produtos",
    icone: "produtos",
    tambem: ["/calculadora", "/calculadora-rapida"],
  },
  { rotulo: "Vendas", href: "/pedidos", icone: "vendas", tambem: ["/clientes"] },
];

const itensMais: { rotulo: string; href: string; icone: NomeIcone }[] = [
  { rotulo: "Estoque", href: "/estoque", icone: "compra" },
  { rotulo: "Preço do produto", href: "/calculadora", icone: "etiqueta" },
  { rotulo: "Cálculo rápido", href: "/calculadora-rapida", icone: "calculadora" },
  { rotulo: "Clientes", href: "/clientes", icone: "conversa" },
  { rotulo: "Dados do ateliê", href: "/empresa", icone: "atelie" },
];

/** Ativo quando o endereço é o próprio href ou uma página dentro dele. */
function estaAtivo(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const classeItemBarra = (ativo: boolean) => `
  flex
  min-h-[58px]
  w-full
  flex-col
  items-center
  justify-center
  gap-1
  rounded-2xl
  px-1
  py-1
  text-[15px]
  leading-tight
  focus-visible:outline-none
  focus-visible:ring-[3px]
  focus-visible:ring-destaque
  ${ativo ? "bg-destaque-suave font-bold text-destaque-escuro" : "text-texto"}
`;

const classeItemPainel = `
  flex
  min-h-14
  w-full
  items-center
  gap-3
  rounded-2xl
  px-3
  text-lg
  text-texto
  hover:bg-fundo
  focus-visible:outline-none
  focus-visible:ring-[3px]
  focus-visible:ring-destaque
`;

export function MenuInferior() {
  const pathname = usePathname();
  const router = useRouter();
  const painelRef = useRef<HTMLDialogElement>(null);

  const maisAtivo = estaAtivo(pathname, "/empresa");

  function abrirPainel() {
    painelRef.current?.showModal();
  }

  function fecharPainel() {
    painelRef.current?.close();
  }

  /* Mesma saída do Sidebar antigo. */
  async function sair() {
    fecharPainel();
    await createClient().auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <nav
        aria-label="Menu principal"
        className="
          fixed
          inset-x-0
          bottom-0
          z-40
          border-t
          border-borda
          bg-cartao
          px-2
          pt-1
          pb-[max(0.25rem,env(safe-area-inset-bottom))]
          md:hidden
        "
      >
        <ul className="grid grid-cols-5 gap-1">
          {itensBarra.map((item) => {
            const ativo = [item.href, ...(item.tambem ?? [])].some(
              (href) => estaAtivo(pathname, href)
            );

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={ativo ? "page" : undefined}
                  className={classeItemBarra(ativo)}
                >
                  <Icone nome={item.icone} />
                  <span>{item.rotulo}</span>
                </Link>
              </li>
            );
          })}

          <li>
            <button
              type="button"
              onClick={abrirPainel}
              aria-haspopup="dialog"
              aria-current={maisAtivo ? "page" : undefined}
              className={classeItemBarra(maisAtivo)}
            >
              <Icone nome="menu" />
              <span>Mais</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Painel "Mais": <dialog> nativo com showModal() (foco preso e Esc
          nativos). Fecha ao escolher, no Esc, no clique fora e em "Fechar". */}
      <dialog
        ref={painelRef}
        aria-labelledby="titulo-mais-opcoes"
        onClick={(e) => {
          if (e.target === e.currentTarget) fecharPainel();
        }}
        className="
          mx-auto
          mt-auto
          mb-0
          w-full
          max-w-lg
          rounded-t-3xl
          border
          border-borda
          bg-cartao
          p-0
          text-texto
          backdrop:bg-black/50
          md:hidden
        "
      >
        <div className="px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2
              id="titulo-mais-opcoes"
              className="px-3 text-2xl font-bold"
            >
              Mais opções
            </h2>

            <button
              type="button"
              onClick={fecharPainel}
              className="
                flex
                min-h-12
                items-center
                gap-2
                rounded-2xl
                px-3
                text-lg
                font-bold
                text-destaque
                hover:bg-destaque-suave
                focus-visible:outline-none
                focus-visible:ring-[3px]
                focus-visible:ring-destaque
              "
            >
              <Icone nome="fechar" />
              <span>Fechar</span>
            </button>
          </div>

          <ul className="flex flex-col gap-1">
            {itensMais.map((item) => {
              const ativo = estaAtivo(pathname, item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={fecharPainel}
                    aria-current={ativo ? "page" : undefined}
                    className={`${classeItemPainel} ${
                      ativo ? "bg-destaque-suave font-bold text-destaque-escuro" : ""
                    }`}
                  >
                    <Icone nome={item.icone} />
                    <span>{item.rotulo}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 border-t border-borda pt-3">
            <button
              type="button"
              onClick={sair}
              className={classeItemPainel}
            >
              <Icone nome="sair" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
