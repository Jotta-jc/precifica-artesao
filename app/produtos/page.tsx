"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { CheckboxField } from "@/components/forms/CheckboxField";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icone } from "@/components/ui/Icone";
import { LinkBotao } from "@/components/ui/LinkBotao";
import { Loading } from "@/components/ui/Loading";
import { formatarMoeda } from "@/lib/formatar";
import {
  faltaTempo,
  filtrarProdutos,
  ROTULOS_TIPO,
  SEM_CATEGORIA,
  type Produto,
  type TipoProduto,
} from "@/lib/produtos";
import {
  getCategoriasProduto,
  getProdutos,
  type CategoriaProduto,
} from "@/services/produtos.service";

type Estado = "carregando" | "erro" | "pronto";

const opcoesTipo = (Object.keys(ROTULOS_TIPO) as TipoProduto[]).map((tipo) => ({
  valor: tipo,
  rotulo: ROTULOS_TIPO[tipo],
}));

function nomeCategoria(p: Produto) {
  return p.categoria_info?.nome ?? "Sem categoria";
}

/** Preço de venda gravado; nulo ou 0 = ainda não definido. */
function precoTexto(p: Produto) {
  return p.preco && p.preco > 0 ? formatarMoeda(p.preco) : "Preço não definido";
}

/** Aviso âmbar "Falta informar o tempo" (ícone + texto). */
function AvisoTempo() {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl bg-aviso-fundo px-3 py-1 text-base text-aviso-texto">
      <Icone nome="alerta" tamanho={20} />
      Falta informar o tempo
    </span>
  );
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [tentativa, setTentativa] = useState(0);

  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"" | TipoProduto>("");
  const [mostrarArquivados, setMostrarArquivados] = useState(false);

  useEffect(() => {
    let ativo = true;

    Promise.all([getProdutos(), getCategoriasProduto()])
      .then(([lista, cats]) => {
        if (!ativo) return;
        setProdutos(lista);
        setCategorias(cats);
        setEstado("pronto");
      })
      .catch(() => {
        /* Mensagem técnica não vai para a tela. */
        if (ativo) setEstado("erro");
      });

    return () => {
      ativo = false;
    };
  }, [tentativa]);

  function tentarDeNovo() {
    setEstado("carregando");
    setTentativa((n) => n + 1);
  }

  function limparFiltros() {
    setBusca("");
    setFiltroCategoria("");
    setFiltroTipo("");
  }

  const ordenados = useMemo(
    () =>
      [...produtos].sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
      ),
    [produtos]
  );

  const filtrados = filtrarProdutos(ordenados, {
    busca,
    categoria: filtroCategoria,
    tipo: filtroTipo,
    mostrarArquivados,
  });

  const opcoesCategoria = [
    ...categorias.map((c) => ({ valor: String(c.id), rotulo: c.nome })),
    { valor: SEM_CATEGORIA, rotulo: "Sem categoria" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <CabecalhoPagina
        titulo="Produtos"
        subtitulo="O que você vende: peças e aulas"
        acao={
          <LinkBotao href="/produtos/novo" icone="mais">
            Novo produto
          </LinkBotao>
        }
      />

      {estado === "carregando" && <Loading texto="Carregando produtos..." />}

      {estado === "erro" && <ErrorState aoTentarDeNovo={tentarDeNovo} />}

      {estado === "pronto" && produtos.length === 0 && (
        <EmptyState
          icone="produtos"
          titulo="Você ainda não cadastrou produtos"
          texto="Cadastre o que você vende para calcular o preço de cada peça ou aula."
          acao={
            <LinkBotao href="/produtos/novo" icone="mais">
              Cadastrar produto
            </LinkBotao>
          }
        />
      )}

      {estado === "pronto" && produtos.length > 0 && (
        <>
          <div className="mb-4 grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-start">
            <TextField
              rotulo="Buscar produto"
              tipo="search"
              valor={busca}
              aoMudar={setBusca}
              dica="Pelo nome do produto"
            />
            <SelectField
              rotulo="Categoria"
              valor={filtroCategoria}
              aoMudar={setFiltroCategoria}
              opcoes={opcoesCategoria}
              textoVazio="Todas"
            />
            <SelectField
              rotulo="Tipo"
              valor={filtroTipo}
              aoMudar={(v) => setFiltroTipo(v as "" | TipoProduto)}
              opcoes={opcoesTipo}
              textoVazio="Todos"
            />
          </div>

          <div className="mb-6">
            <CheckboxField
              rotulo="Mostrar arquivados"
              marcado={mostrarArquivados}
              aoMudar={setMostrarArquivados}
            />
          </div>

          {filtrados.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-3xl border border-borda bg-cartao p-5 text-lg">
              <p className="font-bold">Nenhum produto encontrado</p>
              <p className="text-texto-suave">
                Mude a busca ou os filtros
                {!mostrarArquivados && ", ou marque “Mostrar arquivados”"}.
              </p>
              <Button variante="discreto" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            </div>
          ) : (
            <>
              {/* Celular: cartões clicáveis */}
              <ul className="flex flex-col gap-3 md:hidden">
                {filtrados.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/produtos/${p.id}`}
                      className="flex min-h-[88px] items-center gap-3 rounded-3xl border border-borda bg-cartao p-4 text-texto hover:bg-destaque-suave focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-destaque"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xl font-bold">{p.nome}</span>
                          {!p.ativo && <Badge>Arquivado</Badge>}
                        </div>
                        <p className="mt-1 text-base text-texto-suave">
                          {nomeCategoria(p)} · {ROTULOS_TIPO[p.tipo]}
                        </p>
                        <p className="mt-1 text-lg font-bold">{precoTexto(p)}</p>
                        {faltaTempo(p) && (
                          <div className="mt-2">
                            <AvisoTempo />
                          </div>
                        )}
                      </div>
                      <Icone nome="avancar" className="text-destaque" />
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Computador: tabela */}
              <div className="hidden overflow-hidden rounded-3xl border border-borda bg-cartao md:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-lg">
                    <thead>
                      <tr className="border-b border-borda text-base text-texto-suave">
                        <th scope="col" className="px-5 py-4 font-bold">Nome</th>
                        <th scope="col" className="px-5 py-4 font-bold">Categoria</th>
                        <th scope="col" className="px-5 py-4 font-bold">Tipo</th>
                        <th scope="col" className="px-5 py-4 font-bold">Preço de venda</th>
                        <th scope="col" className="px-5 py-4 font-bold">Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtrados.map((p) => (
                        <tr key={p.id} className="border-b border-borda last:border-b-0">
                          <td className="px-5 py-3">
                            <Link
                              href={`/produtos/${p.id}`}
                              className="inline-flex min-h-12 items-center rounded-xl font-bold text-destaque underline underline-offset-4 hover:text-destaque-escuro focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-destaque"
                            >
                              {p.nome}
                            </Link>
                          </td>
                          <td className="px-5 py-3">{nomeCategoria(p)}</td>
                          <td className="px-5 py-3">{ROTULOS_TIPO[p.tipo]}</td>
                          <td className="whitespace-nowrap px-5 py-3">{precoTexto(p)}</td>
                          <td className="px-5 py-3">
                            <div className="flex flex-col items-start gap-2">
                              {!p.ativo && <Badge>Arquivado</Badge>}
                              {faltaTempo(p) && <AvisoTempo />}
                              {p.ativo && !faltaTempo(p) && (
                                <span className="text-texto-suave">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
