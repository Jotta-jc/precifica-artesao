"use client";

import { useEffect, useState } from "react";

import { LembreteTermometro } from "@/components/inicio/LembreteTermometro";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { Cartao } from "@/components/ui/Cartao";
import { ErrorState } from "@/components/ui/ErrorState";
import { LinkBotao } from "@/components/ui/LinkBotao";
import { Loading } from "@/components/ui/Loading";
import { getMateriais } from "@/services/materiais.service";
import { getProdutos } from "@/services/produtos.service";

type Estado = "carregando" | "erro" | "pronto";

/* Início mínimo (Etapa 8, H5): só os totais de produtos e materiais ativos.
   O Início motivacional, com os números do negócio, vem numa fase própria. */
export default function InicioPage() {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [totalMateriais, setTotalMateriais] = useState(0);

  useEffect(() => {
    let ativo = true;

    Promise.all([getProdutos(), getMateriais()])
      .then(([produtos, materiais]) => {
        if (!ativo) return;
        setTotalProdutos(produtos.filter((p) => p.ativo).length);
        /* Material sem valor em "ativo" (linhas antigas) conta como ativo. */
        setTotalMateriais(materiais.filter((m) => m.ativo !== false).length);
        setEstado("pronto");
      })
      .catch(() => {
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <CabecalhoPagina titulo="Início" subtitulo="Um resumo do seu ateliê." />

      {/* Busca própria: se falhar, não afeta os cartões abaixo. */}
      <LembreteTermometro />

      {estado === "carregando" && <Loading texto="Carregando o resumo..." />}

      {estado === "erro" && <ErrorState aoTentarDeNovo={tentarDeNovo} />}

      {estado === "pronto" && (
        <div className="grid gap-6 sm:grid-cols-2">
          <Cartao titulo="Produtos">
            <p className="text-4xl font-bold text-texto">{totalProdutos}</p>
            <p className="mt-1 text-lg text-texto-suave">
              {totalProdutos === 1 ? "produto ativo" : "produtos ativos"}
            </p>
            <LinkBotao href="/produtos" variante="secundario" icone="avancar" className="mt-4">
              Ver produtos
            </LinkBotao>
          </Cartao>

          <Cartao titulo="Materiais">
            <p className="text-4xl font-bold text-texto">{totalMateriais}</p>
            <p className="mt-1 text-lg text-texto-suave">
              {totalMateriais === 1 ? "material ativo" : "materiais ativos"}
            </p>
            <LinkBotao href="/materiais" variante="secundario" icone="avancar" className="mt-4">
              Ver materiais
            </LinkBotao>
          </Cartao>
        </div>
      )}
    </div>
  );
}
