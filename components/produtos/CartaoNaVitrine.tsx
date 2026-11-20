"use client";

import { useState, type FormEvent } from "react";

import { OpcoesGrandes, type OpcaoGrande } from "@/components/forms/OpcoesGrandes";
import { QuantityField } from "@/components/forms/QuantityField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { Aviso } from "@/components/produtos/AvisosPreco";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Cartao } from "@/components/ui/Cartao";
import { Icone } from "@/components/ui/Icone";
import { LinkBotao } from "@/components/ui/LinkBotao";
import type { Produto } from "@/lib/produtos";
import {
  produtoNaVitrine,
  textoPrazo,
  textoPreco,
  validarVitrineProduto,
  type ErrosVitrineProduto,
  type PrazoProduto,
  type Vitrine,
} from "@/lib/vitrine";

type SimNao = "sim" | "nao";

/** A vitrine da artesã, carregada à parte pela página. */
export type EstadoVitrineDoAtelie =
  | { estado: "carregando" | "erro" }
  | { estado: "pronto"; vitrine: Vitrine | null };

/** O que o cartão manda para a página gravar. */
export interface DadosVitrineProduto {
  publicado: boolean;
  descricao: string;
  mostrar_preco: boolean;
  /** Só no produto físico (aula não tem prazo). */
  prazo?: PrazoProduto;
  prazo_dias: number | null;
}

interface CartaoNaVitrineProps {
  /** O produto como está gravado. */
  produto: Produto;
  vitrine: EstadoVitrineDoAtelie;
  salvando: boolean;
  /** A página grava e mostra o aviso de sucesso; devolve a mensagem de erro, ou null. */
  aoSalvar: (dados: DadosVitrineProduto) => Promise<string | null>;
}

const OPCOES_PUBLICADO: OpcaoGrande<SimNao>[] = [
  {
    valor: "sim",
    rotulo: "Sim, mostrar",
    descricao: "Aparece na sua vitrine quando ela estiver publicada.",
  },
  { valor: "nao", rotulo: "Não mostrar", descricao: "Fica só aqui no sistema." },
];

const OPCOES_PRAZO: OpcaoGrande<PrazoProduto>[] = [
  { valor: "pronta_entrega", rotulo: "Pronta entrega", descricao: "A peça já está feita." },
  { valor: "sob_encomenda", rotulo: "Sob encomenda", descricao: "Você faz depois do pedido." },
];

/* Ordem dos campos com erro na tela, para levar o foco ao primeiro. */
const ORDEM_ERROS: (keyof ErrosVitrineProduto)[] = ["descricao", "prazo_dias"];
const ID_CAMPO: Record<keyof ErrosVitrineProduto, string> = {
  descricao: "vitrine-produto-descricao",
  prazo_dias: "vitrine-produto-prazo-dias",
};

/** Cartão "Na vitrine" do produto: o que aparece na vitrine pública. A página grava. */
export function CartaoNaVitrine({ produto, vitrine, salvando, aoSalvar }: CartaoNaVitrineProps) {
  /* O tipo GRAVADO decide (como a ficha técnica), não o do formulário sem salvar. */
  const fisico = produto.tipo === "fisico";

  /* Nasce uma vez, a partir do produto gravado. */
  const [publicado, setPublicado] = useState<SimNao>(produto.publicado ? "sim" : "nao");
  const [descricao, setDescricao] = useState(produto.descricao ?? "");
  const [mostrarPreco, setMostrarPreco] = useState<SimNao>(produto.mostrar_preco ? "sim" : "nao");
  const [prazo, setPrazo] = useState<PrazoProduto>(produto.prazo);
  const [prazoDias, setPrazoDias] = useState<number | null>(produto.prazo_dias);

  const [erros, setErros] = useState<ErrosVitrineProduto>({});
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  /* Situação pelo que está GRAVADO. */
  const vitrinePublicada = vitrine.estado === "pronto" && vitrine.vitrine?.publicada === true;
  const apareceAgora = produtoNaVitrine(produto, vitrinePublicada);

  const temPreco = produto.preco !== null && produto.preco > 0;
  const textoPrecoAtual = textoPreco({ preco: produto.preco, mostrar_preco: mostrarPreco === "sim" });
  const previa = fisico
    ? `${textoPrecoAtual} · ${textoPrazo({ prazo, prazo_dias: prazoDias })}`
    : textoPrecoAtual;

  const opcoesPreco: OpcaoGrande<SimNao>[] = [
    {
      valor: "sim",
      rotulo: "Mostrar o preço",
      descricao: temPreco
        ? `Vai aparecer ${textoPreco({ preco: produto.preco, mostrar_preco: true })}`
        : "Ainda sem preço salvo: vai aparecer Preço sob consulta.",
    },
    {
      valor: "nao",
      rotulo: "Preço sob consulta",
      descricao: "A cliente pergunta o preço pelo WhatsApp.",
    },
  ];

  function limparAvisos() {
    setErroSalvar(null);
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (salvando) return;

    const dados: DadosVitrineProduto = {
      publicado: publicado === "sim",
      descricao,
      mostrar_preco: mostrarPreco === "sim",
      ...(fisico ? { prazo } : {}),
      prazo_dias: fisico ? prazoDias : null,
    };

    const errosTela = validarVitrineProduto(dados);
    setErros(errosTela);
    const primeiro = ORDEM_ERROS.find((campo) => errosTela[campo]);
    if (primeiro) {
      document.getElementById(ID_CAMPO[primeiro])?.focus();
      return;
    }

    setErroSalvar(null);
    setErroSalvar(await aoSalvar(dados));
  }

  return (
    <Cartao titulo="Na vitrine">
      <form onSubmit={salvar} noValidate className="flex flex-col gap-6">
        {vitrine.estado === "pronto" && (
          <div>
            {apareceAgora ? (
              <Badge variante="sucesso">Aparece na sua vitrine</Badge>
            ) : (
              <Badge variante="neutro">Não aparece na vitrine</Badge>
            )}
          </div>
        )}

        <OpcoesGrandes<SimNao>
          id="vitrine-produto-publicado"
          legenda="Mostrar na vitrine?"
          name="vitrine-publicado"
          opcoes={OPCOES_PUBLICADO}
          valor={publicado}
          aoMudar={(v) => {
            setPublicado(v);
            limparAvisos();
          }}
        />

        {publicado === "sim" && !produto.ativo && (
          <Aviso>Produto arquivado: não aparece na vitrine.</Aviso>
        )}

        {publicado === "sim" && vitrine.estado === "pronto" && !vitrinePublicada && (
          <div className="flex flex-col items-start gap-3">
            <Aviso>Sua vitrine ainda não está publicada.</Aviso>
            <LinkBotao href="/empresa/vitrine" variante="secundario">
              Arrumar minha vitrine
            </LinkBotao>
          </div>
        )}

        <TextAreaField
          id="vitrine-produto-descricao"
          rotulo="Descrição"
          linhas={4}
          limite={1000}
          valor={descricao}
          aoMudar={(v) => {
            setDescricao(v);
            if (erros.descricao) setErros((e) => ({ ...e, descricao: undefined }));
            limparAvisos();
          }}
          dica={
            fisico
              ? "Opcional. Conte o tamanho, as cores e os materiais da peça."
              : "Opcional. Conte o que a aluna vai aprender."
          }
          erro={erros.descricao}
        />

        <OpcoesGrandes<SimNao>
          id="vitrine-produto-mostrar-preco"
          legenda="Preço na vitrine"
          name="vitrine-mostrar-preco"
          opcoes={opcoesPreco}
          valor={mostrarPreco}
          aoMudar={(v) => {
            setMostrarPreco(v);
            limparAvisos();
          }}
        />

        {fisico && (
          <div className="flex flex-col gap-4">
            <OpcoesGrandes<PrazoProduto>
              id="vitrine-produto-prazo"
              legenda="Prazo"
              name="vitrine-prazo"
              opcoes={OPCOES_PRAZO}
              valor={prazo}
              aoMudar={(v) => {
                setPrazo(v);
                /* Pronta entrega não tem dias. */
                if (v === "pronta_entrega") {
                  setPrazoDias(null);
                  setErros((e) => ({ ...e, prazo_dias: undefined }));
                }
                limparAvisos();
              }}
            />

            {prazo === "sob_encomenda" && (
              <div className="max-w-xs">
                <QuantityField
                  id="vitrine-produto-prazo-dias"
                  rotulo="Fica pronto em até quantos dias?"
                  valor={prazoDias}
                  aoMudar={(v) => {
                    setPrazoDias(v);
                    if (erros.prazo_dias) setErros((e) => ({ ...e, prazo_dias: undefined }));
                    limparAvisos();
                  }}
                  casas={0}
                  unidade="dias"
                  dica="Opcional. De 1 a 365."
                  erro={erros.prazo_dias}
                />
              </div>
            )}
          </div>
        )}

        <p className="rounded-2xl bg-fundo px-4 py-3 text-lg text-texto">
          Na vitrine vai aparecer: <strong>{previa}</strong>
        </p>

        <div className="flex flex-col items-start gap-3">
          <Button type="submit" icone="sucesso" disabled={salvando} className="w-full sm:w-auto">
            {salvando ? "Salvando..." : "Salvar na vitrine"}
          </Button>

          {erroSalvar !== null && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl bg-perigo-suave p-4 text-lg text-texto"
            >
              <Icone nome="alerta" className="mt-0.5 text-perigo" />
              <p>{erroSalvar}</p>
            </div>
          )}
        </div>
      </form>
    </Cartao>
  );
}
