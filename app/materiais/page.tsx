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
import { formatarCustoUnitario } from "@/lib/formatar";
import {
  aparenciaSituacao,
  formatarQuantidadeComUnidade,
  rotuloUnidade,
  situacaoEstoque,
} from "@/lib/materiais";
import {
  getCategoriasMaterial,
  getMateriais,
  type CategoriaMaterial,
  type Material,
} from "@/services/materiais.service";

type Estado = "carregando" | "erro" | "pronto";

/** Minúsculas e sem acentos, para a busca. */
function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function nomeCategoria(m: Material) {
  return m.categoria_info?.nome ?? m.categoria ?? "";
}

function custoTexto(m: Material) {
  const custo = Number(m.custo_por_unidade ?? 0);
  return `${formatarCustoUnitario(custo)} por ${rotuloUnidade(m.unidade_uso, 1)}`;
}

/** Selo: "Arquivado" para arquivados; senão, a situação do estoque. */
function Situacao({ material }: { material: Material }) {
  if (material.ativo === false) return <Badge>Arquivado</Badge>;

  const { rotulo, variante } =
    aparenciaSituacao[situacaoEstoque(material.estoque_atual, material.minimum_stock)];

  return <Badge variante={variante}>{rotulo}</Badge>;
}

export default function MateriaisPage() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMaterial[]>([]);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [tentativa, setTentativa] = useState(0);

  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [mostrarArquivados, setMostrarArquivados] = useState(false);

  useEffect(() => {
    let ativo = true;

    Promise.all([getMateriais(), getCategoriasMaterial()])
      .then(([lista, cats]) => {
        if (!ativo) return;
        setMateriais(lista);
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

  const ordenados = useMemo(
    () =>
      [...materiais].sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
      ),
    [materiais]
  );

  const ativos = ordenados.filter((m) => m.ativo !== false);

  const precisamComprar = ativos.filter(
    (m) => situacaoEstoque(m.estoque_atual, m.minimum_stock) !== "em_dia"
  );

  const termo = normalizar(busca.trim());

  const filtrados = ordenados.filter((m) => {
    if (!mostrarArquivados && m.ativo === false) return false;
    if (filtroCategoria && String(m.category_id) !== filtroCategoria) return false;
    if (termo && !normalizar(m.nome).includes(termo)) return false;
    return true;
  });

  const temFiltro = Boolean(termo || filtroCategoria);

  function limparBusca() {
    setBusca("");
    setFiltroCategoria("");
  }

  const nomesAviso =
    precisamComprar.slice(0, 3).map((m) => m.nome).join(", ") +
    (precisamComprar.length > 3 ? ` e mais ${precisamComprar.length - 3}` : "");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <CabecalhoPagina
        titulo="Materiais"
        subtitulo="O que você compra para produzir"
        acao={
          <LinkBotao href="/materiais/novo" icone="mais">
            Novo material
          </LinkBotao>
        }
      />

      {estado === "carregando" && <Loading texto="Carregando materiais..." />}

      {estado === "erro" && <ErrorState aoTentarDeNovo={tentarDeNovo} />}

      {estado === "pronto" && materiais.length === 0 && (
        <EmptyState
          icone="materiais"
          titulo="Você ainda não cadastrou materiais"
          texto="Cadastre o que você compra para produzir e o sistema calcula o custo de cada peça."
          acao={
            <LinkBotao href="/materiais/novo" icone="mais">
              Cadastrar o primeiro material
            </LinkBotao>
          }
        />
      )}

      {estado === "pronto" && materiais.length > 0 && (
        <>
          {precisamComprar.length > 0 && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-aviso-fundo p-4 text-lg text-aviso-texto">
              <Icone nome="alerta" className="mt-0.5" />
              <div>
                <p className="font-bold">
                  {precisamComprar.length === 1
                    ? "1 material está acabando"
                    : `${precisamComprar.length} materiais estão acabando`}
                </p>
                <p>{nomesAviso}</p>
              </div>
            </div>
          )}

          <div className="mb-6 grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:items-start">
            <TextField
              rotulo="Buscar material"
              tipo="search"
              valor={busca}
              aoMudar={setBusca}
              dica="Pelo nome do material"
            />
            <SelectField
              rotulo="Categoria"
              valor={filtroCategoria}
              aoMudar={setFiltroCategoria}
              opcoes={categorias.map((c) => ({ valor: String(c.id), rotulo: c.nome }))}
              textoVazio="Todas"
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
              <p>
                {temFiltro
                  ? termo
                    ? <>Nenhum material encontrado para &lsquo;{busca.trim()}&rsquo;.</>
                    : "Nenhum material nesta categoria."
                  : "Nenhum material ativo. Marque “Mostrar arquivados” para ver os arquivados."}
              </p>
              {temFiltro && (
                <Button variante="discreto" onClick={limparBusca}>
                  Limpar busca
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Celular: cartões clicáveis */}
              <ul className="flex flex-col gap-3 md:hidden">
                {filtrados.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/materiais/${m.id}`}
                      className="flex min-h-[88px] items-center gap-3 rounded-3xl border border-borda bg-cartao p-4 text-texto hover:bg-destaque-suave focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-destaque"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xl font-bold">{m.nome}</span>
                          <Situacao material={m} />
                        </div>
                        {nomeCategoria(m) && (
                          <p className="mt-1 text-base text-texto-suave">{nomeCategoria(m)}</p>
                        )}
                        <p className="mt-1 text-lg">
                          Em estoque:{" "}
                          {formatarQuantidadeComUnidade(Number(m.estoque_atual ?? 0), m.unidade_uso)}
                        </p>
                        <p className="text-lg">Custo: {custoTexto(m)}</p>
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
                        <th scope="col" className="px-5 py-4 font-bold">Em estoque</th>
                        <th scope="col" className="px-5 py-4 font-bold">Custo por unidade</th>
                        <th scope="col" className="px-5 py-4 font-bold">Situação</th>
                        <th scope="col" className="px-5 py-4 font-bold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtrados.map((m) => (
                        <tr key={m.id} className="border-b border-borda last:border-b-0">
                          <td className="px-5 py-3 font-bold">{m.nome}</td>
                          <td className="px-5 py-3">{nomeCategoria(m) || "—"}</td>
                          <td className="whitespace-nowrap px-5 py-3">
                            {formatarQuantidadeComUnidade(Number(m.estoque_atual ?? 0), m.unidade_uso)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3">{custoTexto(m)}</td>
                          <td className="px-5 py-3">
                            <Situacao material={m} />
                          </td>
                          <td className="px-5 py-3">
                            <LinkBotao
                              href={`/materiais/${m.id}`}
                              variante="secundario"
                              icone="editar"
                              aria-label={`Editar ${m.nome}`}
                            >
                              Editar
                            </LinkBotao>
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
