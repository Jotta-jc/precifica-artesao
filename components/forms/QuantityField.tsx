"use client";

import {
  CampoNumerico,
  type CampoNumericoProps,
} from "@/components/forms/CampoNumerico";

type QuantityFieldProps = Omit<
  CampoNumericoProps,
  | "casasMinimas"
  | "prefixo"
  | "sufixo"
  | "mensagemInvalido"
> & {
  /** Mostrada à direita, dentro do campo (ex.: "metros", "unidades"). */
  unidade?: string;
};

/** Campo de quantidade: sem "R$"; reformata para "1.234,5" (sem zeros sobrando). */
export function QuantityField({
  unidade,
  casas = 2,
  ...props
}: QuantityFieldProps) {
  return (
    <CampoNumerico
      {...props}
      casas={casas}
      casasMinimas={0}
      sufixo={unidade}
      mensagemInvalido="Digite um número como 2,5"
    />
  );
}
