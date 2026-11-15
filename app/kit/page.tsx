"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { Cartao } from "@/components/ui/Cartao";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icone, nomesIcones } from "@/components/ui/Icone";
import { Loading } from "@/components/ui/Loading";
import {
  formatarMoeda,
  formatarNumero,
  lerNumero,
} from "@/lib/formatar";

const exemplosMoeda = [0, 12.5, 1234.5, NaN];
const exemplosNumero: [number, number | undefined][] = [
  [1234.5, undefined],
  [2.125, 2],
  [0.333333, 3],
  [10, undefined],
];
const exemplosLeitura = ["12,50", "1.234,50", "12.5", "", "abc"];

export default function KitPage() {
  const [tentativas, setTentativas] = useState(0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <div className="mb-6 flex items-start gap-3 rounded-2xl bg-aviso-fundo p-4 text-lg text-aviso-texto">
        <Icone nome="informacao" className="mt-0.5" />
        <p>
          Página de demonstração do kit visual. Não aparece no menu.
        </p>
      </div>

      <CabecalhoPagina
        titulo="Kit visual"
        subtitulo="Componentes base do Precifica+ com o visual aprovado."
        acao={
          <Button icone="mais">Novo produto</Button>
        }
      />

      <div className="flex flex-col gap-6">
        <Cartao titulo="Botões">
          <div className="flex flex-col gap-6">
            {(
              [
                ["primario", "Primário"],
                ["secundario", "Secundário"],
                ["perigo", "Perigo"],
                ["discreto", "Discreto"],
              ] as const
            ).map(([variante, rotulo]) => (
              <div key={variante}>
                <h3 className="mb-3 text-lg font-bold text-texto-suave">
                  {rotulo}
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button variante={variante}>Salvar</Button>
                  <Button variante={variante} carregando>
                    Salvar
                  </Button>
                  <Button variante={variante} disabled>
                    Desabilitado
                  </Button>
                  <Button
                    variante={variante}
                    icone={variante === "perigo" ? "excluir" : "editar"}
                  >
                    {variante === "perigo" ? "Excluir" : "Editar"}
                  </Button>
                </div>
              </div>
            ))}

            <div>
              <h3 className="mb-3 text-lg font-bold text-texto-suave">
                Largura total
              </h3>
              <Button larguraTotal icone="sucesso">
                Confirmar pedido
              </Button>
            </div>
          </div>
        </Cartao>

        <Cartao titulo="Ícones">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {nomesIcones.map((nome) => (
              <li
                key={nome}
                className="flex flex-col items-center gap-2 rounded-2xl border border-borda p-3 text-texto"
              >
                <Icone nome={nome} tamanho={28} />
                <span className="text-base">{nome}</span>
              </li>
            ))}
          </ul>
        </Cartao>

        <Cartao titulo="Cartão">
          <p className="text-lg text-texto-suave">
            Este é um cartão com título. Use para agrupar informações.
          </p>
        </Cartao>

        <Cartao titulo="Selos">
          <div className="flex flex-wrap gap-3">
            <Badge>Orçamento</Badge>
            <Badge variante="sucesso">Entregue</Badge>
            <Badge variante="aviso">Estoque baixo</Badge>
            <Badge variante="perigo">Atrasado</Badge>
          </div>
        </Cartao>

        <Cartao titulo="Carregando">
          <Loading />
          <Loading texto="Buscando seus materiais..." />
        </Cartao>

        <Cartao titulo="Lista vazia">
          <EmptyState
            icone="vendas"
            titulo="Você ainda não tem clientes"
            texto="Cadastre a primeira cliente para começar a registrar pedidos."
            acao={
              <Button icone="mais">
                Cadastrar o primeiro cliente
              </Button>
            }
          />
        </Cartao>

        <Cartao titulo="Erro ao carregar">
          <ErrorState
            aoTentarDeNovo={() => setTentativas((n) => n + 1)}
          />
          <p className="mt-3 text-base text-texto-suave">
            Tentativas nesta demonstração: {tentativas}
          </p>
        </Cartao>

        <Cartao titulo="Formatação">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="mb-2 text-lg font-bold">formatarMoeda</h3>
              <ul className="space-y-1 text-lg">
                {exemplosMoeda.map((valor) => (
                  <li key={String(valor)}>
                    <span className="text-texto-suave">{String(valor)} → </span>
                    {formatarMoeda(valor)}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-bold">formatarNumero</h3>
              <ul className="space-y-1 text-lg">
                {exemplosNumero.map(([valor, casas]) => (
                  <li key={`${valor}-${casas}`}>
                    <span className="text-texto-suave">
                      {valor}
                      {casas !== undefined ? ` (${casas} casas)` : ""} →{" "}
                    </span>
                    {formatarNumero(valor, casas)}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-bold">lerNumero</h3>
              <ul className="space-y-1 text-lg">
                {exemplosLeitura.map((texto) => (
                  <li key={texto || "vazio"}>
                    <span className="text-texto-suave">
                      {texto === "" ? "(vazio)" : `"${texto}"`} →{" "}
                    </span>
                    {String(lerNumero(texto))}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Cartao>
      </div>
    </div>
  );
}
