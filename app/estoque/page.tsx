"use client";

import { useEffect, useState } from "react";

import { SelectField } from "@/components/forms/SelectField";
import { Badge } from "@/components/ui/Badge";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { Cartao } from "@/components/ui/Cartao";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LinkBotao } from "@/components/ui/LinkBotao";
import { Loading } from "@/components/ui/Loading";
import { rotuloTipoMovimento, varianteTipoMovimento } from "@/lib/estoque";
import { formatarData, formatarMoeda } from "@/lib/formatar";
import { formatarQuantidadeComUnidade } from "@/lib/materiais";
import { listarMovimentos, type Movimento } from "@/services/estoque.service";
import { getMateriais, type Material } from "@/services/materiais.service";

type Estado = "carregando" | "erro" | "pronto";

/** "+450 metros" (entrou) ou "−20 gramas" (saiu). */
function quantidadeComSinal(m: Movimento) {
  const quantidade = Number(m.quantidade || 0);
  const entrou = m.tipo === "entrada" || (m.tipo === "ajuste" && quantidade > 0);
  const texto = formatarQuantidadeComUnidade(
    Math.abs(quantidade),
    m.materials?.unidade_uso
  );
  return `${entrou ? "+" : "−"}${texto}`;
}

export default function EstoquePage() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [movimentos, setMovimentos] = useState<Movimento[]>([]);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    let ativo = true;

    Promise.all([getMateriais(), listarMovimentos(filtro ? Number(filtro) : undefined)])
      .then(([listaMateriais, listaMovimentos]) => {
        if (!ativo) return;
        setMateriais(listaMateriais);
        setMovimentos(listaMovimentos);
        setEstado("pronto");
      })
      .catch(() => {
        /* Mensagem técnica não vai para a tela. */
        if (ativo) setEstado("erro");
      });

    return () => {
      ativo = false;
    };
  }, [filtro, tentativa]);

  function trocarFiltro(valor: string) {
    setEstado("carregando");
    setFiltro(valor);
  }

  function tentarDeNovo() {
    setEstado("carregando");
    setTentativa((n) => n + 1);
  }

  const opcoesMaterial = [...materiais]
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }))
    .map((m) => ({ valor: String(m.id), rotulo: m.nome }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <CabecalhoPagina
        titulo="Estoque"
        subtitulo="Compras, usos e correções dos seus materiais"
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <LinkBotao href="/estoque/novo?tipo=entrada" icone="compra" larguraTotal className="min-h-14">
          Registrar compra
        </LinkBotao>
        <LinkBotao href="/estoque/novo?tipo=saida" icone="materiais" larguraTotal className="min-h-14">
          Registrar uso
        </LinkBotao>
        <LinkBotao
          href="/estoque/novo?tipo=ajuste"
          variante="secundario"
          icone="editar"
          larguraTotal
          className="min-h-14"
        >
          Corrigir contagem
        </LinkBotao>
      </div>

      <Cartao titulo="Últimos movimentos">
        <div className="mb-6 max-w-md">
          <SelectField
            rotulo="Material"
            valor={filtro}
            aoMudar={trocarFiltro}
            opcoes={opcoesMaterial}
            textoVazio="Todos"
          />
        </div>

        {estado === "carregando" && <Loading texto="Carregando movimentos..." />}

        {estado === "erro" && <ErrorState aoTentarDeNovo={tentarDeNovo} />}

        {estado === "pronto" && movimentos.length === 0 && (
          <EmptyState
            icone="compra"
            titulo="Nenhum movimento ainda"
            texto="Registre uma compra, um uso ou uma correção de contagem para ver o histórico aqui."
          />
        )}

        {estado === "pronto" && movimentos.length > 0 && (
          <>
            {/* Celular: um cartão por movimento */}
            <ul className="flex flex-col gap-3 md:hidden">
              {movimentos.map((m) => (
                <li key={m.id} className="rounded-2xl border border-borda p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-bold">{m.materials?.nome ?? "Material"}</span>
                    <Badge variante={varianteTipoMovimento(m.tipo)}>
                      {rotuloTipoMovimento(m.tipo)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-base text-texto-suave">{formatarData(m.created_at)}</p>
                  <p className="mt-1 text-lg font-bold">{quantidadeComSinal(m)}</p>
                  <p className="text-lg">{formatarMoeda(Number(m.valor_total ?? 0))}</p>
                  {m.observacao && (
                    <p className="mt-1 text-base text-texto-suave">{m.observacao}</p>
                  )}
                </li>
              ))}
            </ul>

            {/* Computador: tabela */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-lg">
                <thead>
                  <tr className="border-b border-borda text-base text-texto-suave">
                    <th scope="col" className="px-4 py-3 font-bold">Data</th>
                    <th scope="col" className="px-4 py-3 font-bold">Material</th>
                    <th scope="col" className="px-4 py-3 font-bold">Tipo</th>
                    <th scope="col" className="px-4 py-3 font-bold">Quantidade</th>
                    <th scope="col" className="px-4 py-3 font-bold">Valor</th>
                    <th scope="col" className="px-4 py-3 font-bold">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentos.map((m) => (
                    <tr key={m.id} className="border-b border-borda last:border-b-0">
                      <td className="whitespace-nowrap px-4 py-3">{formatarData(m.created_at)}</td>
                      <td className="px-4 py-3 font-bold">{m.materials?.nome ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variante={varianteTipoMovimento(m.tipo)}>
                          {rotuloTipoMovimento(m.tipo)}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{quantidadeComSinal(m)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {formatarMoeda(Number(m.valor_total ?? 0))}
                      </td>
                      <td className="px-4 py-3 text-texto-suave">{m.observacao || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Cartao>
    </div>
  );
}
