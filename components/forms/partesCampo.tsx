"use client";

import { useId } from "react";

import { Icone } from "@/components/ui/Icone";

/* Peças comuns aos campos de formulário (uso interno de components/forms). */

export function useIdsCampo(
  id: string | undefined,
  dica: string | undefined,
  erro: string | undefined
) {
  const gerado = useId();
  const idCampo = id ?? gerado;
  const idDica = `${idCampo}-dica`;
  const idErro = `${idCampo}-erro`;

  const descritoPor =
    [dica ? idDica : null, erro ? idErro : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return { idCampo, idDica, idErro, descritoPor };
}

export function RotuloCampo({
  htmlFor,
  texto,
  obrigatorio,
}: {
  htmlFor: string;
  texto: string;
  obrigatorio?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-lg font-bold text-texto"
    >
      {texto}
      {obrigatorio && (
        <span className="ml-2 font-normal text-texto-suave">
          (obrigatório)
        </span>
      )}
    </label>
  );
}

export function MensagensCampo({
  idDica,
  dica,
  idErro,
  erro,
}: {
  idDica: string;
  dica?: string;
  idErro: string;
  erro?: string;
}) {
  return (
    <>
      {dica && (
        <p
          id={idDica}
          className="mt-2 text-base text-texto-suave"
        >
          {dica}
        </p>
      )}

      {erro && (
        <p
          id={idErro}
          className="mt-2 flex items-start gap-2 text-base font-bold text-perigo"
        >
          <Icone nome="alerta" tamanho={20} className="mt-0.5" />
          <span>{erro}</span>
        </p>
      )}
    </>
  );
}

/** Aparência da caixa do campo (input, textarea, select). */
export function classeCaixa(erro?: string) {
  return `
    block
    w-full
    min-h-[52px]
    rounded-2xl
    border-2
    bg-white
    px-4
    py-3
    text-lg
    text-texto
    placeholder:text-texto-suave
    focus:outline-none
    focus:ring-[3px]
    focus:ring-destaque
    ${erro ? "border-perigo" : "border-borda-campo focus:border-destaque"}
  `;
}
