import type { ReactNode } from "react";

import { Icone } from "@/components/ui/Icone";
import { LinkBotao } from "@/components/ui/LinkBotao";
import { ErroPrecificacao } from "@/lib/precificacao";

/* Avisos das telas de preço (painel do produto e Cálculo rápido). */

/** Mensagem do motor (português simples); outro erro vira texto genérico. */
export function mensagemDoErroPreco(erro: unknown): string {
  return erro instanceof ErroPrecificacao
    ? erro.message
    : "Não foi possível calcular o preço agora.";
}

/** Aviso âmbar com o botão para completar os Dados do ateliê. */
export function AvisoAtelie({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-4 rounded-2xl bg-aviso-fundo p-4 text-lg text-aviso-texto"
    >
      <div className="flex items-start gap-3">
        <Icone nome="alerta" className="mt-0.5" />
        <p>{children}</p>
      </div>
      <LinkBotao href="/empresa" variante="secundario" icone="atelie">
        Completar Dados do ateliê
      </LinkBotao>
    </div>
  );
}

/** Caixa âmbar de aviso (mesmas classes da Ficha técnica e de Materiais). */
export function Aviso({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-aviso-fundo p-4 text-lg text-aviso-texto">
      <Icone nome="alerta" className="mt-0.5" />
      <p>{children}</p>
    </div>
  );
}
