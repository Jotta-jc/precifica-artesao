"use client";

import { useState } from "react";

import {
  MensagensCampo,
  RotuloCampo,
  useIdsCampo,
} from "@/components/forms/partesCampo";
import { formatarNumero, lerNumero } from "@/lib/formatar";

/* Base do MoneyField e do QuantityField (uso interno de components/forms).
   A usuária digita livremente ("12,50", "1.234,50"); o valor numérico é
   enviado a cada tecla; ao sair do campo, o texto é reformatado. */

export interface CampoNumericoProps {
  rotulo: string;
  valor: number | null;
  aoMudar: (valor: number | null) => void;
  casas?: number;
  casasMinimas?: number;
  prefixo?: string;
  sufixo?: string;
  mensagemInvalido: string;
  permitirNegativo?: boolean;
  placeholder?: string;
  dica?: string;
  erro?: string;
  obrigatorio?: boolean;
  id?: string;
  name?: string;
  disabled?: boolean;
}

function textoDoValor(
  valor: number | null,
  casas: number,
  casasMinimas: number
) {
  return valor === null
    ? ""
    : formatarNumero(valor, casas, casasMinimas);
}

export function CampoNumerico({
  rotulo,
  valor,
  aoMudar,
  casas = 2,
  casasMinimas = 0,
  prefixo,
  sufixo,
  mensagemInvalido,
  permitirNegativo = false,
  placeholder,
  dica,
  erro,
  obrigatorio = false,
  id,
  name,
  disabled,
}: CampoNumericoProps) {
  const [texto, setTexto] = useState(() =>
    textoDoValor(valor, casas, casasMinimas)
  );
  const [invalido, setInvalido] = useState(false);
  const [valorAnterior, setValorAnterior] = useState(valor);

  function lerValido(t: string) {
    const n = lerNumero(t);
    if (n === null) return null;
    if (!permitirNegativo && n < 0) return null;
    return n;
  }

  /* Se a tela trocar o valor por fora (ex.: limpar o formulário),
     o texto acompanha. Padrão do React para ajustar estado a partir
     de uma prop, sem useEffect. */
  if (valor !== valorAnterior) {
    setValorAnterior(valor);

    if (valor !== lerValido(texto)) {
      setTexto(textoDoValor(valor, casas, casasMinimas));
      setInvalido(false);
    }
  }

  const erroMostrado =
    erro ?? (invalido ? mensagemInvalido : undefined);

  const { idCampo, idDica, idErro, descritoPor } =
    useIdsCampo(id, dica, erroMostrado);

  function aoDigitar(novo: string) {
    setTexto(novo);
    setInvalido(false);
    aoMudar(lerValido(novo));
  }

  function aoSair() {
    if (texto.trim() === "") {
      setTexto("");
      return;
    }

    const n = lerValido(texto);

    if (n === null) {
      setInvalido(true);
      return;
    }

    setTexto(formatarNumero(n, casas, casasMinimas));
  }

  return (
    <div>
      <RotuloCampo
        htmlFor={idCampo}
        texto={rotulo}
        obrigatorio={obrigatorio}
      />

      <div
        className={`
          flex
          min-h-[52px]
          w-full
          items-center
          gap-2
          rounded-2xl
          border-2
          bg-white
          px-4
          text-lg
          focus-within:ring-[3px]
          focus-within:ring-destaque
          ${erroMostrado ? "border-perigo" : "border-borda-campo focus-within:border-destaque"}
          ${disabled ? "opacity-60" : ""}
        `}
      >
        {prefixo && (
          <span
            aria-hidden="true"
            className="shrink-0 font-bold text-texto-suave"
          >
            {prefixo}
          </span>
        )}

        <input
          id={idCampo}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={texto}
          onChange={(e) => aoDigitar(e.target.value)}
          onBlur={aoSair}
          placeholder={placeholder}
          required={obrigatorio}
          disabled={disabled}
          aria-invalid={erroMostrado ? true : undefined}
          aria-describedby={descritoPor}
          className="min-w-0 flex-1 bg-transparent py-3 text-texto placeholder:text-texto-suave focus:outline-none"
        />

        {sufixo && (
          <span
            aria-hidden="true"
            className="shrink-0 text-texto-suave"
          >
            {sufixo}
          </span>
        )}
      </div>

      <MensagensCampo
        idDica={idDica}
        dica={dica}
        idErro={idErro}
        erro={erroMostrado}
      />
    </div>
  );
}
